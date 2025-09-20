// api/robots.js
module.exports = async function (req, res) { res.setHeader('Content-Type','text/plain'); res.send('User-agent: *\nAllow: /'); }
