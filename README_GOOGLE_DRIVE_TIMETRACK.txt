TIMETRACK PWA - GOOGLE DRIVE SYNC1

BAN DA DUOC DIEU CHINH SAN CHO DOMAIN:
  https://timetrack-one-xi.vercel.app

CAU TRUC DEPLOY:
  index.html
  manifest.webmanifest
  service-worker.js
  vercel.json
  icons/
  api/
    _helpers.js
    google-login.js
    google-callback.js
    google-session.js
    google-logout.js
    drive-data.js

GOOGLE DRIVE:
- Folder: TimeTrackPWA
- File: timetrack_data.json
- Scope: https://www.googleapis.com/auth/drive.file

GOOGLE OAUTH WEB CLIENT - TIMETRACK:
Authorized JavaScript origin:
  https://timetrack-one-xi.vercel.app

Authorized redirect URI:
  https://timetrack-one-xi.vercel.app/api/google-callback

VERCEL ENVIRONMENT VARIABLES - PRODUCTION:
1. GOOGLE_CLIENT_ID
   Gia tri: Client ID cua OAuth Web Client TimeTrack

2. GOOGLE_CLIENT_SECRET
   Gia tri: Client Secret cua OAuth Web Client TimeTrack

3. GOOGLE_REDIRECT_URI
   Gia tri chinh xac:
   https://timetrack-one-xi.vercel.app/api/google-callback

SAU KHI TAO/DOI BIEN MOI TRUONG:
- Redeploy Production.
- Kiem tra API:
  https://timetrack-one-xi.vercel.app/api/google-session
- Neu dung, trang phai tra JSON thay vi 404.

GOOGLE AUTH PLATFORM > DATA ACCESS:
Giu cac scope:
- openid
- email
- profile
- https://www.googleapis.com/auth/drive.file
Khong can cap quyen drive toan bo.
