// Builds ImageKit on-the-fly transformation URLs for the profile photo.
//
// Non-destructive by design: we never re-upload or mutate the stored
// photoUrl/photoFileId. Every place that displays the photo (preview,
// dashboard thumbnail, PDF export) asks ImageKit for a transformed variant
// via URL query params at render time. ImageKit processes + caches each
// unique transform on first request.
//
// fo-face = crop centered on the detected face. If ImageKit's face
// detector doesn't find a face in the photo, it automatically falls back
// to a standard center crop — no error, no code-level fallback needed here.
export function getAvatarUrl(photoUrl, { size = 200 } = {}) {
  if (!photoUrl) return photoUrl
  const separator = photoUrl.includes('?') ? '&' : '?'
  return `${photoUrl}${separator}tr=w-${size},h-${size},fo-face,c-at_max`
}
