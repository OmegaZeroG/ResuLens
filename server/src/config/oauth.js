// Central place for OAuth env vars. Nothing here throws at import time — a
// provider just won't work (the redirect route returns a clear 500) until its
// client ID/secret are filled in, same pattern as ImageKit's lazy client.
export const oauthConfig = {
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback',
  },
}
