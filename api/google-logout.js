const { parseCookies, clearAuthCookies } = require('./_helpers');
module.exports = async function handler(req, res) {
  const c = parseCookies(req);
  const token = c.g_refresh || c.g_access;
  if (token) {
    try { await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(token), { method: 'POST' }); } catch (_) {}
  }
  clearAuthCookies(res);
  res.status(200).json({ ok: true });
};
