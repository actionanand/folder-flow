const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');

const _isWSL = (() => {
  try {
    const release = os.release().toLowerCase();
    if (release.includes('microsoft') || release.includes('wsl')) return true;
    const proc = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
    return proc.includes('microsoft') || proc.includes('wsl');
  } catch {
    return false;
  }
})();

// WSL2 uses a real Linux kernel (5.x+), WSL1 uses Windows kernel (4.4.x)
const _isWSL2 = (() => {
  if (!_isWSL) return false;
  try {
    const release = os.release().toLowerCase();
    return release.includes('wsl2') || release.includes('microsoft-standard');
  } catch {
    return false;
  }
})();

/**
 * Get the WSL2 internal IP (for binding / port forwarding target).
 */
function getWSLIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Get the Windows host WiFi / Ethernet IP (the one other devices can reach).
 * Only relevant when running inside WSL.
 */
function getWindowsIP() {
  // Method 1: Parse ipconfig.exe output (no $_ escaping issues)
  try {
    const output = execSync('ipconfig.exe', { timeout: 5000 }).toString();
    const lines = output.split('\n');
    let inRelevantAdapter = false;

    for (const line of lines) {
      // Detect adapter section headers
      if (/adapter/i.test(line)) {
        // Only use WiFi / Ethernet adapters, skip virtual ones
        const isVirtual = /vEthernet|WSL|Docker|Loopback|Hyper-V|VPN|Bluetooth/i.test(line);
        const isPhysical = /Wi-?Fi|Wireless|Ethernet/i.test(line);
        inRelevantAdapter = isPhysical && !isVirtual;
      }
      if (inRelevantAdapter) {
        const match = line.match(/IPv4.*?:\s*(\d+\.\d+\.\d+\.\d+)/);
        if (match) return match[1];
      }
    }
  } catch {}

  // Method 2: Fallback — resolv.conf nameserver (Hyper-V gateway, not ideal but usable)
  try {
    const resolv = fs.readFileSync('/etc/resolv.conf', 'utf8');
    const match = resolv.match(/nameserver\s+(\d+\.\d+\.\d+\.\d+)/);
    if (match) return match[1];
  } catch {}

  return null;
}

/**
 * Convert a WSL /mnt/c/... path to a Windows C:\... path.
 */
function wslToWindowsPath(linuxPath) {
  const match = linuxPath.match(/^\/mnt\/([a-zA-Z])\/(.*)$/);
  if (match) {
    return `${match[1].toUpperCase()}:\\${match[2].replace(/\//g, '\\')}`;
  }
  return linuxPath;
}

/**
 * Returns the IP that other LAN devices should use to connect.
 * On WSL → Windows host IP.  On native Linux/macOS → local interface IP.
 */
function getLocalIP() {
  if (_isWSL) {
    return getWindowsIP() || getWSLIP();
  }
  return getWSLIP(); // same logic for non-WSL
}

function isWSL() {
  return _isWSL;
}

function isWSL2() {
  return _isWSL2;
}

module.exports = { getLocalIP, getWSLIP, getWindowsIP, isWSL, isWSL2, wslToWindowsPath };
