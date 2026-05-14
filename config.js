const path = require('path');

const config = {
  // Admin PIN (full access: change PINs, stop any stream, manage everything)
  adminPin: process.env.FOLDER_FLOW_ADMIN_PIN || '1234',

  // User PIN (browse, upload, download, create streams — but no PIN change, can't stop admin streams)
  userPin: process.env.FOLDER_FLOW_USER_PIN || '0000',

  // Web server port
  port: parseInt(process.env.PORT, 10) || 3000,

  // FTP server port
  ftpPort: parseInt(process.env.FTP_PORT, 10) || 2121,

  // FTP passive port range
  ftpPasvMin: parseInt(process.env.FTP_PASV_MIN, 10) || 2122,
  ftpPasvMax: parseInt(process.env.FTP_PASV_MAX, 10) || 2130,

  // Root directory to share (defaults to ./shared)
  shareRoot: process.env.SHARE_ROOT || path.join(__dirname, 'shared'),

  // Upload directory (inside shareRoot)
  uploadDir: 'uploads',

  // Max upload size in bytes (default 2 GB)
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE, 10) || 2 * 1024 * 1024 * 1024,

  // Session secret
  sessionSecret: process.env.SESSION_SECRET || 'folder-flow-secret-change-me',

  // Active shared streams: { token: { filePath, pin, label, createdAt, live, createdBy, scheduledStart } }
  sharedStreams: {},

  // Chat messages: [{ id, text, sender, visibility, createdAt }]
  messages: [],
};

module.exports = config;
