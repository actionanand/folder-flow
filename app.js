const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const { getLocalIP, getWSLIP, isWSL, isWSL2, wslToWindowsPath } = require('./utils/network');
const { generateQR } = require('./utils/qr');
const { startFtpServer } = require('./services/ftp');
const { formatSize } = require('./routes/files');

const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const streamRoutes = require('./routes/stream');
const { requireAuth } = require('./middleware/auth');

const app = express();

// ---- Ensure shared directory exists ----
fs.mkdirSync(config.shareRoot, { recursive: true });

// ---- View engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- Middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// Make formatSize available in all views
app.locals.formatSize = formatSize;

// ---- Routes ----
app.use(authRoutes);
app.use(fileRoutes);
app.use(streamRoutes);

// FTP info page with QR codes
app.get('/ftp-info', requireAuth, async (req, res) => {
  const ip = getLocalIP();
  const webUrl = `http://${ip}:${config.port}`;
  const ftpUrl = `ftp://${ip}:${config.ftpPort}`;

  const [webQR, ftpQR] = await Promise.all([generateQR(webUrl), generateQR(ftpUrl)]);

  res.render('ftp-info', { webUrl, ftpUrl, webQR, ftpQR });
});

// ---- Start servers ----
const lanIP = getLocalIP();
const wslIP = isWSL() ? getWSLIP() : null;

app.listen(config.port, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║           FOLDER FLOW is running!             ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log(`  ║  🌐 Web UI → http://${lanIP}:${config.port}`);
  console.log(`  ║  🔐 PIN   → ${config.pin}`);
  console.log(`  ║  📁 Root  → ${config.shareRoot}`);
  console.log('  ╚══════════════════════════════════════════════╝');

  if (isWSL()) {
    console.log('');
    if (isWSL2()) {
      console.log('  ⚠️  WSL2 detected (NAT mode — port forwarding required)');
      console.log(`  ║  WSL internal IP : ${wslIP}`);
      console.log(`  ║  Windows LAN IP  : ${lanIP}`);
      console.log('  ║');
      console.log('  ║  Mobile devices must connect to the Windows IP above.');
      console.log('  ║  You MUST run port forwarding first (one-time, as Admin):');
      console.log('  ║');
      const winScriptPath = wslToWindowsPath(path.resolve(__dirname, 'setup-port-forward.ps1'));
      console.log('  ║  👉  Open PowerShell as Administrator and run:');
      console.log(`  ║      powershell -ExecutionPolicy Bypass -File "${winScriptPath}"`);
      console.log('  ║');
      console.log('  ║  Or quick manual forwarding (run in Admin PowerShell):');
      console.log(`  ║      netsh interface portproxy add v4tov4 listenport=${config.port} listenaddress=0.0.0.0 connectport=${config.port} connectaddress=${wslIP}`);
      console.log(`  ║      netsh interface portproxy add v4tov4 listenport=${config.ftpPort} listenaddress=0.0.0.0 connectport=${config.ftpPort} connectaddress=${wslIP}`);
      console.log(`  ║      netsh advfirewall firewall add rule name="FolderFlow" dir=in action=allow protocol=TCP localport=${config.port},${config.ftpPort}`);
      console.log(`  ║      netsh advfirewall firewall add rule name="FolderFlow-PASV" dir=in action=allow protocol=TCP localport=${config.ftpPasvMin}-${config.ftpPasvMax}`);
    } else {
      console.log('  ℹ️  WSL1 detected (shared network — no port forwarding needed)');
      console.log(`  ║  LAN IP : ${lanIP}`);
      console.log('  ║');
      console.log('  ║  If your phone cannot connect, open Admin PowerShell and run:');
      console.log(`  ║      netsh advfirewall firewall add rule name="FolderFlow" dir=in action=allow protocol=TCP localport=${config.port},${config.ftpPort}`);
      console.log('  ║  This allows incoming connections through Windows Firewall.');
    }
  }
  console.log('');
});

// Start FTP server
startFtpServer();
