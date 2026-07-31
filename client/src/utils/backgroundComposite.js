// Composites a transparent-background PNG blob onto a solid color.
//
// Used after background removal (either path in backgroundRemoval.js) for
// users who want a plain colored backdrop instead of full transparency —
// a transparent photo dropped into a PDF just shows whatever the page
// background is (usually white), so this gives explicit control, e.g. a
// light gray or navy backdrop that matches a template's palette.
export async function compositeOnColor(blob, hexColor) {
  const imgUrl = URL.createObjectURL(blob)
  try {
    const img = await loadImage(imgUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = hexColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    return await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/png')
    })
  } finally {
    URL.revokeObjectURL(imgUrl)
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image for compositing'))
    img.src = src
  })
}
