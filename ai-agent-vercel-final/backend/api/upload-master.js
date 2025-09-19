// backend/api/upload-master.js
const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

module.exports = (req, res) => {
  if (req.method.toLowerCase() !== 'post') return res.status(405).json({ error: 'Method not allowed' });
  const form = new formidable.IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const file = files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const dest = path.join('/tmp', file.originalFilename || 'master.emv');
    fs.copyFileSync(file.filepath, dest);
    return res.json({ ok:true, path: dest });
  });
};
