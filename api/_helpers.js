const crypto = require('crypto');

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) return;
    try { out[k] = decodeURIComponent(v); } catch { out[k] = v; }
  });
  return out;
}

function cookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value || '')}`];
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  if (opts.secure !== false) parts.push('Secure');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  return parts.join('; ');
}

function clearAuthCookies(res) {
  const expired = { maxAge: 0 };
  res.setHeader('Set-Cookie', [
    cookie('g_access', '', expired),
    cookie('g_refresh', '', expired),
    cookie('g_email', '', expired),
    cookie('g_oauth_state', '', expired),
  ]);
}

function config(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://timetrack-one-xi.vercel.app/api/google-callback';
  if (!clientId || !clientSecret) {
    const e = new Error('Thiếu GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trên Vercel Environment Variables.');
    e.code = 'CONFIG';
    throw e;
  }
  return { clientId, clientSecret, redirectUri };
}

function randomState() {
  return crypto.randomBytes(24).toString('hex');
}

async function refreshAccessToken(req, res) {
  const cookies = parseCookies(req);
  if (cookies.g_access) return cookies.g_access;
  if (!cookies.g_refresh) return null;
  const { clientId, clientSecret } = config(req);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: cookies.g_refresh,
    grant_type: 'refresh_token',
  });
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) return null;
  res.setHeader('Set-Cookie', cookie('g_access', j.access_token, { maxAge: Math.max(60, Number(j.expires_in || 3600) - 60) }));
  return j.access_token;
}

async function googleFetch(token, url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  const r = await fetch(url, { ...options, headers });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Google API ${r.status}: ${text.slice(0, 500)}`);
  }
  return r;
}

module.exports = { parseCookies, cookie, clearAuthCookies, config, randomState, refreshAccessToken, googleFetch };
