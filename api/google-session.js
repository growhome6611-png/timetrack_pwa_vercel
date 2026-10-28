const { parseCookies } = require('./_helpers');
module.exports = async function handler(req, res) {
  const c = parseCookies(req);
  const connected = !!(c.g_email && (c.g_access || c.g_refresh));
  res.status(200).json({ connected, email: connected ? c.g_email : '' });
};
