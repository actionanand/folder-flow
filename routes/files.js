const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const archiver = require('archiver');
const mime = require('mime-types');
const config = require('../config');
const { requireAuth } = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

// Ensure upload dir exists
const uploadPath = path.join(config.shareRoot, config.uploadDir);
fs.mkdirSync(uploadPath, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const subDir = req.query.path || '';
    const dest = path.join(uploadPath, subDir);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: config.maxUploadSize },
});

// Resolve and validate requested path is within shareRoot
function safePath(reqPath) {
  const cleaned = (reqPath || '').replace(/\.\./g, '');
  const full = path.resolve(config.shareRoot, cleaned);
  if (!full.startsWith(path.resolve(config.shareRoot))) {
    return null;
  }
  return full;
}

// Browse files
router.get('/', requireAuth, (req, res) => {
  const reqPath = req.query.path || '';
  const fullPath = safePath(reqPath);

  if (!fullPath || !fs.existsSync(fullPath)) {
    return res.status(404).render('error', { message: 'Path not found' });
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isDirectory()) {
    // Serve the file directly
    return res.download(fullPath);
  }

  const entries = fs.readdirSync(fullPath, { withFileTypes: true }).map((entry) => {
    const entryPath = path.join(fullPath, entry.name);
    const relPath = path.relative(config.shareRoot, entryPath);
    const entryStat = fs.statSync(entryPath);
    const mimeType = entry.isFile() ? mime.lookup(entry.name) || 'application/octet-stream' : null;
    const isVideo = mimeType && mimeType.startsWith('video/');
    const isImage = mimeType && mimeType.startsWith('image/');
    const isAudio = mimeType && mimeType.startsWith('audio/');
    return {
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
      path: relPath,
      size: entryStat.size,
      modified: entryStat.mtime,
      mimeType,
      isVideo,
      isImage,
      isAudio,
    };
  });

  // Sort: folders first, then files alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  const parentPath = reqPath ? path.dirname(reqPath) : null;

  res.render('files', {
    entries,
    currentPath: reqPath,
    parentPath: parentPath === '.' ? '' : parentPath,
    breadcrumbs: buildBreadcrumbs(reqPath),
    isAdmin: isAdmin(req),
  });
});

// Download a file
router.get('/download', requireAuth, (req, res) => {
  const reqPath = req.query.path || '';
  const fullPath = safePath(reqPath);
  if (!fullPath || !fs.existsSync(fullPath)) {
    return res.status(404).render('error', { message: 'File not found' });
  }
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    // Zip and download folder
    res.attachment(`${path.basename(fullPath)}.zip`);
    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);
    archive.directory(fullPath, path.basename(fullPath));
    archive.finalize();
  } else {
    res.download(fullPath);
  }
});

// Upload files
router.post('/upload', requireAuth, upload.array('files', 50), (req, res) => {
  const redirectPath = req.query.path || config.uploadDir;
  res.redirect(`/?path=${encodeURIComponent(redirectPath)}`);
});

// Delete a file or folder
router.post('/delete', requireAuth, (req, res) => {
  const reqPath = req.body.path || '';
  const fullPath = safePath(reqPath);
  if (!fullPath || !fs.existsSync(fullPath)) {
    return res.status(404).render('error', { message: 'Not found' });
  }

  // Protect uploads folder and .gitkeep files
  const relPath = path.relative(path.resolve(config.shareRoot), fullPath);
  if (relPath === config.uploadDir || path.basename(relPath) === '.gitkeep') {
    return res.status(403).render('error', { message: 'This item cannot be deleted' });
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }
  const parent = path.dirname(reqPath);
  res.redirect(`/?path=${encodeURIComponent(parent === '.' ? '' : parent)}`);
});

// Create folder
router.post('/mkdir', requireAuth, (req, res) => {
  const parentDir = req.body.currentPath || '';
  const folderName = (req.body.folderName || '').replace(/[^a-zA-Z0-9_\-. ]/g, '');
  if (!folderName) {
    return res.redirect(`/?path=${encodeURIComponent(parentDir)}`);
  }
  const fullPath = safePath(path.join(parentDir, folderName));
  if (fullPath) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  res.redirect(`/?path=${encodeURIComponent(parentDir)}`);
});

function buildBreadcrumbs(reqPath) {
  if (!reqPath) return [];
  const parts = reqPath.split(path.sep).filter(Boolean);
  const crumbs = [];
  let cumulative = '';
  for (const part of parts) {
    cumulative = cumulative ? cumulative + '/' + part : part;
    crumbs.push({ name: part, path: cumulative });
  }
  return crumbs;
}

// Format file size helper (exposed to views via app.locals)
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

module.exports = router;
module.exports.formatSize = formatSize;
