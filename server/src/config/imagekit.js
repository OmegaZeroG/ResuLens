import ImageKit from '@imagekit/nodejs'

let client = null

// Lazily constructed so the app can still boot (e.g. for /api/health, or before
// you've filled in .env) without an ImageKit key configured.
export function getImageKitClient() {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error('IMAGEKIT_PRIVATE_KEY is not set — add your ImageKit keys to server/.env')
  }
  if (!client) {
    client = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY })
  }
  return client
}
