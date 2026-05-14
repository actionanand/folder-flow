const FtpSrv = require('ftp-srv');
const config = require('../config');
const { getLocalIP, getWSLIP, isWSL } = require('../utils/network');

function startFtpServer() {
  const lanIP = getLocalIP();      // Windows LAN IP (what phones connect to)
  const bindIP = '0.0.0.0';       // Always bind to all interfaces

  const ftpServer = new FtpSrv({
    url: `ftp://${bindIP}:${config.ftpPort}`,
    anonymous: false,
    pasv_url: lanIP,               // Tell FTP clients to connect to the LAN IP for passive data
    pasv_min: config.ftpPasvMin,
    pasv_max: config.ftpPasvMax,
    greeting: ['Welcome to Folder Flow FTP'],
  });

  ftpServer.on('login', ({ connection, username, password }, resolve, reject) => {
    if (password === config.pin) {
      return resolve({ root: config.shareRoot });
    }
    return reject(new Error('Invalid PIN'));
  });

  ftpServer.on('client-error', ({ context, error }) => {
    console.error('FTP client error:', error.message);
  });

  ftpServer.listen().then(() => {
    console.log(`  📂 FTP server  → ftp://${lanIP}:${config.ftpPort}`);
    console.log(`     FTP login   → user: anything | password: <your PIN>`);
    if (isWSL()) {
      console.log(`     (FTP bound to 0.0.0.0, passive IP set to ${lanIP})`);
    }
  });

  return ftpServer;
}

module.exports = { startFtpServer };
