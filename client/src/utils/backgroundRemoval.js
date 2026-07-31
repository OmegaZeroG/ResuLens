// Hybrid background-removal pipeline for profile photos.
//
// Two independent methods can turn a photo into a transparent-background
// PNG:
//   1. ImageKit's `e-bgremove` AI transformation — applied via a URL
//      parameter on the already-uploaded photo. Server-side, fast,
//      generally the higher-quality result. No SDK call and no dashboard
//      toggle needed, it just works via the URL parameter on any signed-in
//      ImageKit account. Free tier: ~65 removals/month (10 extension units
//      each, out of 650 free units/month) — once that's used up, ImageKit
//      starts failing the request.
//   2. `@imgly/background-removal` — an in-browser ML model (ONNX + WASM,
//      runs entirely on the user's device). Free, no account, no quota. The
//      model/runtime assets (tens of MB) are fetched from IMG.LY's CDN on
//      first use and cached by the browser afterwards, so the first run is
//      slower than every run after it.
//
// Strategy: always try ImageKit first. If that request fails for ANY
// reason (quota exhausted, network error, timeout, non-image response),
// fall back to the client-side model automatically. There's no proactive
// quota check — ImageKit doesn't expose a "units remaining" API — so this
// fails open on the failing call rather than pre-checking.
const IMAGEKIT_TIMEOUT_MS = 15000

async function tryImageKit(photoUrl) {
  const separator = photoUrl.includes('?') ? '&' : '?'
  const url = `${photoUrl}${separator}tr=e-bgremove`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), IMAGEKIT_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`ImageKit e-bgremove returned HTTP ${res.status}`)
    }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`ImageKit e-bgremove returned a non-image response (${contentType || 'no content-type'})`)
    }
    return await res.blob()
  } finally {
    clearTimeout(timer)
  }
}

async function tryClientModel(photoUrl, onProgress) {
  // Code-split: the model/runtime glue is a couple MB of JS on its own —
  // only pull it into the bundle if the ImageKit path actually failed.
  const { default: imglyRemoveBackground } = await import('@imgly/background-removal')
  return imglyRemoveBackground(photoUrl, {
    progress: onProgress,
  })
}

// Returns { blob, source } where source is 'imagekit' or 'client-ml' — the
// caller can use this to show the user which path was used.
export async function removeBackgroundHybrid(photoUrl, { onProgress } = {}) {
  try {
    const blob = await tryImageKit(photoUrl)
    return { blob, source: 'imagekit' }
  } catch (err) {
    console.warn('[bg-removal] ImageKit e-bgremove failed, falling back to client-side ML:', err.message)
    const blob = await tryClientModel(photoUrl, onProgress)
    return { blob, source: 'client-ml' }
  }
}
