const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const { getLocalIP } = require('../utils/network');
const { generateQR } = require('../utils/qr');

// Create a shared stream (authenticated user picks a file + sets a stream PIN)
router.post('/share-stream', requireAuth, async (req, res) => {
  const { filePath: reqPath, streamPin, live, delay, allowPip, showMute } = req.body;
  if (!reqPath || !streamPin || streamPin.length < 4) {
    return res.status(400).render('error', { message: 'File path and PIN (4+ chars) required' });
  }

  const cleaned = (reqPath || '').replace(/\.\./g, '');
  const fullPath = path.resolve(config.shareRoot, cleaned);
  if (!fullPath.startsWith(path.resolve(config.shareRoot)) || !fs.existsSync(fullPath)) {
    return res.status(404).render('error', { message: 'File not found' });
  }

  const token = crypto.randomBytes(12).toString('hex');
  const isLive = live === 'on' || live === 'true';
  const delayMin = isLive ? (parseInt(delay) || 0) : 0;
  const scheduledStart = new Date(Date.now() + delayMin * 60000);
  config.sharedStreams[token] = {
    filePath: cleaned,
    fullPath,
    pin: streamPin,
    label: path.basename(cleaned),
    createdAt: new Date(),
    live: isLive,
    scheduledStart,
    allowPip: allowPip === 'on',
    showMute: showMute === 'on',
    createdBy: isAdmin(req) ? 'admin' : 'user',
  };

  const ip = getLocalIP();
  const shareUrl = `http://${ip}:${config.port}/s/${token}`;
  const qr = await generateQR(shareUrl);

  const mode = isLive ? 'LIVE' : 'normal';
  console.log(`  🎬 Stream shared (${mode}): ${path.basename(cleaned)} → ${shareUrl} (PIN: ${streamPin})`);

  res.render('share-created', { shareUrl, qr, label: path.basename(cleaned), token, isLive, delay: delayMin });
});

// List active streams (for managing)
router.get('/streams', requireAuth, (req, res) => {
  const ip = getLocalIP();
  const admin = isAdmin(req);
  const streams = Object.entries(config.sharedStreams).map(([token, s]) => ({
    token,
    label: s.label,
    url: `http://${ip}:${config.port}/s/${token}`,
    createdAt: s.createdAt,
    live: s.live || false,
    createdBy: s.createdBy || 'user',
    canStop: admin || s.createdBy !== 'admin',
  }));
  res.render('streams', { streams, isAdmin: admin });
});

// Stop a shared stream
router.post('/streams/stop', requireAuth, (req, res) => {
  const { token } = req.body;
  const stream = config.sharedStreams[token];
  if (!stream) return res.redirect('/streams');

  const admin = isAdmin(req);
  // Admin can stop anything; user can only stop non-admin streams
  if (admin || stream.createdBy !== 'admin') {
    console.log(`  🛑 Stream stopped: ${stream.label}`);
    delete config.sharedStreams[token];
  }
  res.redirect('/streams');
});

// --- Public routes (no full auth needed, just stream PIN) ---

// Stream login page
router.get('/s/:token', (req, res) => {
  const stream = config.sharedStreams[req.params.token];
  if (!stream) return res.status(404).render('error', { message: 'Stream not found or expired' });

  if (req.session[`stream_${req.params.token}`]) {
    const mimeType = mime.lookup(stream.fullPath) || 'video/mp4';
    const isAudio = mimeType.startsWith('audio/');
    return res.render('shared-player', {
      token: req.params.token, label: stream.label, mimeType, isAudio,
      error: null, live: stream.live || false,
      allowPip: stream.allowPip !== false,
      showMute: stream.showMute !== false,
    });
  }
  res.render('shared-player', {
    token: req.params.token, label: stream.label, mimeType: null, isAudio: false,
    error: null, live: stream.live || false,
    allowPip: true, showMute: true,
  });
});

// Stream PIN auth
router.post('/s/:token', (req, res) => {
  const stream = config.sharedStreams[req.params.token];
  if (!stream) return res.status(404).render('error', { message: 'Stream not found or expired' });

  if (req.body.pin === stream.pin) {
    req.session[`stream_${req.params.token}`] = true;
    const mimeType = mime.lookup(stream.fullPath) || 'video/mp4';
    const isAudio = mimeType.startsWith('audio/');
    return res.render('shared-player', {
      token: req.params.token, label: stream.label, mimeType, isAudio,
      error: null, live: stream.live || false,
      allowPip: stream.allowPip !== false,
      showMute: stream.showMute !== false,
    });
  }
  res.render('shared-player', {
    token: req.params.token, label: stream.label, mimeType: null, isAudio: false,
    error: 'Invalid PIN', live: stream.live || false,
    allowPip: true, showMute: true,
  });
});

// Sync endpoint for live streams (returns timing info)
router.get('/s/:token/sync', (req, res) => {
  const stream = config.sharedStreams[req.params.token];
  if (!stream) return res.status(404).json({ error: 'Not found' });
  if (!req.session[`stream_${req.params.token}`]) return res.status(403).json({ error: 'Forbidden' });
  if (!stream.live) return res.json({ started: true, elapsed: 0 });
  const now = Date.now();
  const start = stream.scheduledStart ? stream.scheduledStart.getTime() : stream.createdAt.getTime();
  if (now < start) {
    return res.json({ started: false, startsInMs: start - now });
  }
  return res.json({ started: true, elapsed: (now - start) / 1000 });
});

// Stream data endpoint (serves the actual file with range support)
router.get('/s/:token/data', (req, res) => {
  const stream = config.sharedStreams[req.params.token];
  if (!stream) return res.status(404).send('Not found');
  if (!req.session[`stream_${req.params.token}`]) return res.status(403).send('Forbidden');

  const stat = fs.statSync(stream.fullPath);
  const fileSize = stat.size;
  const mimeType = mime.lookup(stream.fullPath) || 'application/octet-stream';

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(stream.fullPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
    });
    fs.createReadStream(stream.fullPath).pipe(res);
  }
});

module.exports = router;
