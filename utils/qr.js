const QRCode = require('qrcode');

async function generateQR(text) {
  return QRCode.toDataURL(text, {
    width: 280,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

module.exports = { generateQR };
