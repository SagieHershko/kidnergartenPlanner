// ─── Google Calendar Setup ───────────────────────────────────────────────────
// 1. Go to https://console.cloud.google.com
// 2. Create a project → "APIs & Services" → "Enable APIs" → enable "Google Calendar API"
// 3. "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
//    • Application type: Web application
//    • Authorized JavaScript origins: http://localhost:5173
// 4. Copy the Client ID and paste it below
// ─────────────────────────────────────────────────────────────────────────────

export const GOOGLE_CLIENT_ID =
  "436891739732-5s0rpgc5fua9g34brosbo8imbr2e66ii.apps.googleusercontent.com";
