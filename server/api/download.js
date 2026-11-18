const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
  const GITHUB_REPO = 'LuccasBenedetti/DoragonTable';
  const LATEST_RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/latest/download/DoragonTable-Setup-1.0.0.exe`;

  const localFilePath = path.join(__dirname, '../public/downloads/DoragonTable-Setup.exe');

  if (fs.existsSync(localFilePath)) {
    try {
      const stat = fs.statSync(localFilePath);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.microsoft.portable-executable',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="DoragonTable-Setup.exe"',
      });
      return fs.createReadStream(localFilePath).pipe(res);
    } catch (err) {
      console.warn('Error streaming local installer, redirecting to GitHub release:', err);
    }
  }

  // Fallback: Redirect to GitHub releases
  res.writeHead(302, {
    Location: LATEST_RELEASE_URL,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end();
};
