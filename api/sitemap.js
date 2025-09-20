// api/sitemap.js
module.exports = async function (req, res) { res.setHeader('Content-Type','application/xml'); res.send('<urlset></urlset>'); }
