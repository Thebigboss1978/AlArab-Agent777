// backend/api/report.js
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const report = req.body;
  if (!report) return res.status(400).json({ error: 'No report body' });

  const filename = `report-${Date.now()}.json`;
  const filepath = path.join('/tmp', filename);
  try {
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    return res.json({ ok: true, stored: filepath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
