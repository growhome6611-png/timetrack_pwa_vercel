const { parseCookies, cookie, config } = require('./_helpers');

module.exports = async function handler(req, res) {
  try {
    const cookies = parseCookies(req);
    const state = String(req.query?.state || '');
    const code = String(req.query?.code || '');
    const error = String(req.query?.error || '');
    if (error) throw new Error(`Google OAuth: ${error}`);
    if (!code) throw new Error('Google không trả về authorization code.');
    if (!state || !cookies.g_oauth_state || state !== cookies.g_oauth_state) throw new Error('OAuth state không hợp lệ. Hãy thử đăng nhập lại.');

    const { clientId, clientSecret, redirectUri } = config(req);
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const tr = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const tj = await tr.json();
    if (!tr.ok || !tj.access_token) throw new Error(tj.error_description || tj.error || 'Không đổi được authorization code thành token.');

    const ur = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tj.access_token}` },
    });
    const user = await ur.json();
    if (!ur.ok || !user.email) throw new Error('Không đọc được Gmail của tài khoản vừa chọn.');

    const setCookies = [
      cookie('g_access', tj.access_token, { maxAge: Math.max(60, Number(tj.expires_in || 3600) - 60) }),
      cookie('g_email', user.email, { maxAge: 60 * 60 * 24 * 30 }),
      cookie('g_oauth_state', '', { maxAge: 0 }),
    ];
    if (tj.refresh_token) setCookies.push(cookie('g_refresh', tj.refresh_token, { maxAge: 60 * 60 * 24 * 90 }));
    res.setHeader('Set-Cookie', setCookies);
    res.writeHead(302, { Location: '/?drive_auth=1' });
    res.end();
  } catch (e) {
    res.writeHead(302, { Location: '/?drive_auth_error=' + encodeURIComponent(e.message) });
    res.end();
  }
};
