const { parseCookies, refreshAccessToken, googleFetch } = require('./_helpers');

const FOLDER_NAME = 'TimeTrackPWA';
const FILE_NAME = 'timetrack_data.json';
function escQ(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

async function findOrCreateFolder(token) {
  const q = `name='${escQ(FOLDER_NAME)}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  let r = await googleFetch(token, 'https://www.googleapis.com/drive/v3/files?spaces=drive&fields=files(id,name)&pageSize=10&q=' + encodeURIComponent(q));
  let j = await r.json();
  if (j.files?.length) return j.files[0].id;
  r = await googleFetch(token, 'https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  });
  j = await r.json();
  return j.id;
}

async function findFile(token, folderId) {
  const q = `name='${escQ(FILE_NAME)}' and '${escQ(folderId)}' in parents and trashed=false`;
  const r = await googleFetch(token, 'https://www.googleapis.com/drive/v3/files?spaces=drive&fields=files(id,name,modifiedTime)&pageSize=10&q=' + encodeURIComponent(q));
  const j = await r.json();
  return j.files?.[0] || null;
}

async function upload(token, folderId, fileId, payload) {
  const boundary = '-------timetrackpwa-' + Date.now();
  const metadata = { name: FILE_NAME, mimeType: 'application/json' };
  if (!fileId) metadata.parents = [folderId];
  const body = '--' + boundary + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + '\r\n' +
    '--' + boundary + '\r\n' +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(payload) + '\r\n' +
    '--' + boundary + '--';
  const url = fileId
    ? 'https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(fileId) + '?uploadType=multipart&fields=id,modifiedTime'
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime';
  const r = await googleFetch(token, url, {
    method: fileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
    body,
  });
  return await r.json();
}

module.exports = async function handler(req, res) {
  try {
    const cookies = parseCookies(req);
    if (!cookies.g_email) return res.status(401).json({ error: 'Chưa đăng nhập Google.' });
    const token = await refreshAccessToken(req, res);
    if (!token) return res.status(401).json({ error: 'Phiên Google đã hết hạn. Hãy đăng nhập lại.' });
    const folderId = await findOrCreateFolder(token);
    const file = await findFile(token, folderId);

    if (req.method === 'GET') {
      if (!file) return res.status(204).end();
      const r = await googleFetch(token, 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(file.id) + '?alt=media');
      const text = await r.text();
      if (!text.trim()) return res.status(204).end();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.status(200).send(text);
    }

    if (req.method === 'PUT') {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Payload không hợp lệ.' });
      const out = await upload(token, folderId, file?.id || null, payload);
      return res.status(200).json({ ok: true, id: out.id, modifiedTime: out.modifiedTime });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
};
