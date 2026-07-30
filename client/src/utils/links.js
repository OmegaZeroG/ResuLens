// Users type links as "github.com/user/repo" without a protocol — fine for
// display, but anything that turns it into a real link (an <a href>, or a
// PDF link annotation) needs a real scheme or it gets treated as a relative
// path instead of leaving the site/app.
export function withProtocol(url) {
  if (!url) return url
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}
