// Vercel Serverless Function: Returns current published version & update metadata
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.status(200).json({
    version: '1.0.1',
    productName: 'DoragonTable',
    releaseDate: '2026-11-18',
    mandatoryUpdate: false,
    downloadUrl: 'https://github.com/LuccasBenedetti/DoragonTable/releases/latest/download/DoragonTable-Setup.exe',
    releasesUrl: 'https://github.com/LuccasBenedetti/DoragonTable/releases'
  });
};
