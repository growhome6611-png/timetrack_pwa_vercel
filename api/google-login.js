const { parseCookies, cookie, config, randomState } = require('./_helpers');

module.exports = async function handler(req, res) {
  try {
    const { clientId, redirectUri } = config(req);
    const state = randomState();
    const isSwitch = String(req.query?.switch || '') === '1';
    const cookies = [cookie('g_oauth_state', state, { maxAge: 600 })];
    if (isSwitch) {
      const old = parseCookies(req);
      const oldToken = old.g_refresh || old.g_access;
      if (oldToken) {
        try { await fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(oldToken), { method:'POST' }); } catch (_) {}
      }
      cookies.push(cookie('g_access', '', { maxAge: 0 }));
      cookies.push(cookie('g_refresh', '', { maxAge: 0 }));
      cookies.push(cookie('g_email', '', { maxAge: 0 }));
    }
    res.setHeader('Set-Cookie', cookies);
    const p = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent select_account',
      state,
    });
    res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}` });
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
