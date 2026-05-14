const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');

// Stream video/audio with range support
router.get('/stream', requireAuth, (req, res) => {
  const reqPath = req.query.path || '';
  const cleaned = (reqPath || '').replace(/\.\./g, '');
  const fullPath = path.resolve(config.shareRoot, cleaned);

  if (!fullPath.startsWith(path.resolve(config.shareRoot))) {
    return res.status(403).send('Forbidden');
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).render('error', { message: 'File not found' });
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const mimeType = mime.lookup(fullPath) || 'application/octet-stream';

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const stream = fs.createReadStream(fullPath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
    });
    fs.createReadStream(fullPath).pipe(res);
  }
});

// Video player page
router.get('/player', requireAuth, (req, res) => {
  const reqPath = req.query.path || '';
  const fileName = path.basename(reqPath);
  const mimeType = mime.lookup(fileName) || 'video/mp4';
  const isAudio = mimeType.startsWith('audio/');
  res.render('player', { filePath: reqPath, fileName, mimeType, isAudio });
});

module.exports = router;
