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
| **Live Streaming** | Share a video as 🔴 LIVE — viewers can't seek/rewind |
| **Audio Track Switching** | Switch between multiple audio tracks (e.g. Tamil, Hindi, English) |
| **Shareable Stream Links** | Create PIN-protected shareable URLs with QR codes |
| **Admin / User Roles** | Two-tier PIN auth — Admin has full control, User has limited access |
| **QR Codes** | Scan a QR code from your phone to connect instantly (Web + FTP) |
| **Change PINs via UI** | Admin can change both PINs from the web interface at runtime |
| **Drag & Drop Upload** | Drop files into the browser to upload |
| **Folder Download** | Download entire folders as ZIP archives |
| **Mobile Responsive** | Clean dark UI that works on phones, tablets, and desktops |
| **WSL Auto-detect** | Detects WSL1/WSL2, shows correct IPs and setup instructions |

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

The console will print your local IP and both PINs:

```
  ╔══════════════════════════════════════════════╗
  ║           FOLDER FLOW is running!             ║
  ╠══════════════════════════════════════════════╣
  ║  🌐 Web UI    → http://192.168.x.x:3000
  ║  🔑 Admin PIN → 1234
  ║  🔐 User PIN  → 0000
  ║  📁 Root      → ./shared
  ╚══════════════════════════════════════════════╝
```

---

## Admin vs User

| Capability | Admin | User |
|---|:---:|:---:|
| Browse, download, upload files | ✅ | ✅ |
| Create shared streams | ✅ | ✅ |
| Create live streams | ✅ | ✅ |
| Stop own streams | ✅ | ✅ |
| Stop admin-created streams | ✅ | ❌ |
| Change PINs from UI | ✅ | ❌ |
| View network info / FTP page | ✅ | ✅ |

**Default PINs:** Admin = `1234` / User = `0000`

---

## Live Streaming (🔴 LIVE mode)

Share a video with restricted playback — viewers can only play/pause, **no seeking, rewinding, or fast-forwarding**.

1. Click the **📡** button next to any video/audio file
2. Check **🔴 Live mode**
3. Set a stream PIN and click **Create Stream Link**
4. Share the URL or QR code — viewers enter the stream PIN to watch
5. Manage active streams from the **Streams** page

### How it works
- Live mode removes the seek bar and blocks keyboard shortcuts (arrow keys)
- Viewers get play/pause buttons only
- The video file is served with HTTP range requests — not actual real-time live, but the viewer experience mimics a live broadcast
- Admin-created streams cannot be stopped by users

---

## Audio Track Switching

If a video file has multiple audio tracks (e.g. a movie with Tamil, Hindi, English audio), a dropdown appears in the top bar of the player to switch between them.

> **Note:** Audio track switching depends on browser support for the `audioTracks` API. This works in **Safari** and some Chromium-based browsers. Firefox has limited support. If the dropdown doesn't appear, the browser doesn't expose multiple audio tracks for that file format.

---

## Shareable Stream Links

Create a temporary, PIN-protected link to share a specific video without giving full file access:

1. In the file browser, click **📡** next to a video/audio file
2. Set a stream PIN (separate from the main app PINs)
3. Get a shareable URL + QR code
4. Share it — recipients enter only the stream PIN to watch
5. Stop streams anytime from the **Streams** page

---

## Port Forwarding Setup (Windows — `.bat` launcher)

For WSL2 users, a `setup-port-forward.bat` file is included. **Double-click it** from Windows Explorer — it auto-elevates to Administrator and configures port forwarding + firewall rules.

Alternatively, run manually in Admin PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File C:\path\to\folder-flow\setup-port-forward.ps1
```

To remove forwarding later:
```powershell
powershell -ExecutionPolicy Bypass -File C:\path\to\folder-flow\setup-port-forward.ps1 -Remove
```

---

## ⚡ WSL Users (Windows Subsystem for Linux)

The app auto-detects WSL1 vs WSL2 and shows the correct instructions in both the terminal and the web UI (FTP page → Network Info).

- **WSL1:** Shares Windows networking — no port forwarding needed. May need a firewall rule.
- **WSL2:** Uses NAT — port forwarding required. Run `setup-port-forward.bat` (double-click) or the manual commands shown at startup.

> WSL IP changes on every reboot. Re-run the setup after restart.

---

## Configuration

All settings can be changed via **environment variables** or by editing `config.js`:

| Variable | Default | Description |
|---|---|---|
| `FOLDER_FLOW_ADMIN_PIN` | `1234` | Admin PIN (full access) |
| `FOLDER_FLOW_USER_PIN` | `0000` | User PIN (limited access) |
| `PORT` | `3000` | Web server port |
| `FTP_PORT` | `2121` | FTP server port |
| `FTP_PASV_MIN` | `2122` | FTP passive mode min port |
| `FTP_PASV_MAX` | `2130` | FTP passive mode max port |
| `SHARE_ROOT` | `./shared` | Root directory to share |
| `MAX_UPLOAD_SIZE` | `2147483648` (2 GB) | Max upload file size in bytes |
| `SESSION_SECRET` | `folder-flow-secret-change-me` | Session encryption secret |

### Examples

```bash
# Custom PINs and share your home folder
FOLDER_FLOW_ADMIN_PIN=9876 FOLDER_FLOW_USER_PIN=1111 SHARE_ROOT=/home/user npm start

# Custom ports
PORT=8080 FTP_PORT=2100 npm start
```

---

## FTP Access

The FTP server starts alongside the web server. Connect with any FTP client:

- **Address:** `ftp://<your-ip>:2121`
- **Username:** anything (any value works)
- **Password:** Admin PIN or User PIN

### Recommended FTP clients for mobile

| Platform | App |
|---|---|
| Android | Cx File Explorer, Solid Explorer, Total Commander |
| iOS | FE File Explorer, Documents by Readdle |

### Solid Explorer (Android) — Step by Step

1. Open Solid Explorer → tap ☰ → scroll down → tap ⊕ or "New cloud connection"
2. Select **FTP**
3. **Host:** your IP (shown in console) | **Port:** `2121`
4. **Username:** `user` (anything) | **Password:** your PIN
5. Tap Next → Connect

Visit the **FTP** page in the web UI for QR codes and detailed instructions.

---

## Project Structure

```
folder-flow/
├── app.js                   # Entry point
├── config.js                # Configuration (PINs, ports, paths)
├── package.json
├── setup-port-forward.ps1   # WSL2 port forwarding (PowerShell)
├── setup-port-forward.bat   # Double-click launcher (auto-elevates)
├── middleware/
│   └── auth.js              # Auth middleware (requireAuth, requireAdmin, isAdmin)
├── routes/
│   ├── auth.js              # Login / logout (admin + user PINs)
│   ├── files.js             # Browse, upload, download, delete, mkdir
│   ├── stream.js            # Video/audio streaming (range requests)
│   └── share.js             # Shareable stream links (live + normal)
├── services/
│   └── ftp.js               # FTP server
├── utils/
│   ├── network.js           # IP detection (WSL-aware)
│   └── qr.js                # QR code generation
├── views/                   # EJS templates
│   ├── login.ejs
│   ├── files.ejs
│   ├── player.ejs           # Normal player (with audio track switching)
│   ├── ftp-info.ejs         # FTP info, QR codes, PIN change, network info
│   ├── streams.ejs          # Active streams management
│   ├── share-created.ejs    # Stream created confirmation + QR
│   ├── shared-player.ejs    # Shared/live player (PIN-protected)
│   └── error.ejs
├── public/
│   ├── css/style.css
│   └── js/app.js
└── shared/                  # Default shared directory
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
