# 📂 Folder Flow

**WiFi & FTP file sharing** — share files between your laptop, phone, and other devices on the same local network. No cloud, no internet required.

![Node.js](https://img.shields.io/badge/Node.js-24.x-green) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## Features

| Feature | Description |
|---|---|
| **Web File Browser** | Browse, upload, download, delete files & folders from any browser |
| **FTP Server** | Built-in FTP server for native file manager access on any device |
| **Video Streaming** | Stream videos directly in the browser with range-request support |
| **Audio Playback** | Play audio files in the browser |
| **QR Codes** | Scan a QR code from your phone to connect instantly (Web + FTP) |
| **PIN Auth** | Simple PIN-based security — no accounts needed |
| **Drag & Drop Upload** | Drop files into the browser to upload |
| **Folder Download** | Download entire folders as ZIP archives |
| **Mobile Responsive** | Clean UI that works on phones, tablets, and desktops |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run

```bash
npm start
```

### 3. Open on another device

The console will print your local IP. Open it in a browser on your phone/tablet:

```
http://192.168.x.x:3000
```

Default PIN: `1234`

---

## ⚡ WSL2 Users (Windows Subsystem for Linux) — IMPORTANT

WSL2 runs in a **virtual machine with its own internal IP**. Devices on your WiFi **cannot** reach WSL directly. You must set up **port forwarding** from Windows to WSL.

### One-time setup (run once, as Admin)

1. Open **PowerShell as Administrator** (right-click → Run as administrator)
2. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-port-forward.ps1
```

This will:
- Detect your WSL IP automatically
- Forward ports 3000 + 2121-2130 from Windows → WSL
- Add firewall rules so your phone can connect

3. Then start the app in WSL:

```bash
npm start
```

### Manual quick fix (if you prefer)

In **Admin PowerShell**, run these two commands (replace `WSL_IP` with the IP shown in the `npm start` output):

```powershell
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=WSL_IP
netsh interface portproxy add v4tov4 listenport=2121 listenaddress=0.0.0.0 connectport=2121 connectaddress=WSL_IP
netsh advfirewall firewall add rule name="FolderFlow" dir=in action=allow protocol=TCP localport=3000,2121
```

### After rebooting

WSL gets a **new IP on every reboot**, so re-run the setup script after restart.

### Remove forwarding

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-port-forward.ps1 -Remove
```

---

## Configuration

All settings can be changed via **environment variables** or by editing `config.js`:

| Variable | Default | Description |
|---|---|---|
| `FOLDER_FLOW_PIN` | `1234` | PIN for authentication |
| `PORT` | `3000` | Web server port |
| `FTP_PORT` | `2121` | FTP server port |
| `FTP_PASV_MIN` | `2122` | FTP passive mode min port |
| `FTP_PASV_MAX` | `2130` | FTP passive mode max port |
| `SHARE_ROOT` | `./shared` | Root directory to share |
| `MAX_UPLOAD_SIZE` | `2147483648` (2 GB) | Max upload file size in bytes |
| `SESSION_SECRET` | `folder-flow-secret-change-me` | Session encryption secret |

### Examples

```bash
# Custom PIN and share your home folder
FOLDER_FLOW_PIN=9876 SHARE_ROOT=/home/user npm start

# Custom ports
PORT=8080 FTP_PORT=2100 npm start
```

---

## FTP Access

The FTP server starts alongside the web server. Connect with any FTP client:

- **Address:** `ftp://<your-ip>:2121`
- **Username:** anything (any value works)
- **Password:** your PIN (default: `1234`)

### Recommended FTP clients for mobile

| Platform | App |
|---|---|
| Android | Cx File Explorer, Solid Explorer, Total Commander |
| iOS | FE File Explorer, Documents by Readdle |

Visit the **FTP** page in the web UI to see QR codes for quick connection.

---

## Project Structure

```
folder-flow/
├── app.js                # Entry point
├── config.js             # Configuration
├── package.json
├── middleware/
│   └── auth.js           # PIN auth middleware
├── routes/
│   ├── auth.js           # Login / logout
│   ├── files.js          # Browse, upload, download, delete
│   └── stream.js         # Video/audio streaming
├── services/
│   └── ftp.js            # FTP server
├── utils/
│   ├── network.js        # Local IP detection
│   └── qr.js             # QR code generation
├── views/                # EJS templates
│   ├── login.ejs
│   ├── files.ejs
│   ├── player.ejs
│   ├── ftp-info.ejs
│   └── error.ejs
├── public/
│   ├── css/style.css
│   └── js/app.js
└── shared/               # Default shared directory
```

---

## ⚠️ Important Restrictions & Notes

> **This application will work if:**
> - Your Wi-Fi network allows local LAN communication (devices can see each other)
> - Your firewall allows the configured ports (default: 3000, 2121-2130)
> - Node.js can run on your machine

> **Things that may prevent it from working:**
> - **Antivirus software** may block the local server or flag it
> - **Firewall** blocks incoming ports — you may need to add rules for ports 3000, 2121-2130
> - **Network isolation / AP isolation** prevents device-to-device access (common on public/guest Wi-Fi)
> - **VPN or security agents** may monitor or block local sharing traffic
> - **Admin / elevated rights** may be required to bind to certain ports or modify firewall rules
> - **Corporate networks** often restrict LAN communication between devices

### Firewall quick fix (Windows)

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="Folder Flow Web" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Folder Flow FTP" dir=in action=allow protocol=TCP localport=2121-2130
```

### Firewall quick fix (Linux)

```bash
sudo ufw allow 3000/tcp
sudo ufw allow 2121:2130/tcp
```

---

## License

MIT
