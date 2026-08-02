import { useState } from 'react'
import { Field, SectionCard } from './Field'
import { detectLinkIcon, InitialsIcon } from '../common/icons'
import { getInitials } from '../../utils/name'
import { getAvatarUrl } from '../../utils/imagekitTransform'
import { removeBackgroundHybrid } from '../../utils/backgroundRemoval'
import { compositeOnColor } from '../../utils/backgroundComposite'

const FILL_SWATCHES = [
  { label: 'Transparent', value: '' },
  { label: 'White', value: '#ffffff' },
  { label: 'Light gray', value: '#f1f5f9' },
  { label: 'Navy', value: '#1e293b' },
]

const SOURCE_LABEL = {
  imagekit: 'via ImageKit',
  'client-ml': 'via on-device AI',
}

function blobToFile(blob, filename) {
  return new File([blob], filename, { type: blob.type || 'image/png' })
}

export function ContactSection({
  contact,
  onChange,
  photoUrl,
  onUploadPhoto,
  onRemovePhoto,
  uploadingPhoto,
  onAddLink,
  onUpdateLink,
  onRemoveLink,
}) {
  const [bgProcessing, setBgProcessing] = useState(false)
  const [bgError, setBgError] = useState('')
  // Holds the removal result until the user picks a fill (or transparent)
  // and applies it — nothing is uploaded until they confirm.
  const [bgPreview, setBgPreview] = useState(null) // { blob, url, source }
  const [fillColor, setFillColor] = useState('')

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onUploadPhoto(file)
    e.target.value = '' // allow re-selecting the same file later
  }

  async function handleRemoveBackground() {
    setBgError('')
    setBgProcessing(true)
    try {
      const { blob, source } = await removeBackgroundHybrid(photoUrl)
      setFillColor('')
      setBgPreview({ blob, url: URL.createObjectURL(blob), source })
    } catch (err) {
      setBgError(err.message || 'Background removal failed')
    } finally {
      setBgProcessing(false)
    }
  }

  function handlePickFill(value) {
    setFillColor(value)
  }

  async function handleApplyBackground() {
    if (!bgPreview) return
    setBgError('')
    setBgProcessing(true)
    try {
      const finalBlob = fillColor ? await compositeOnColor(bgPreview.blob, fillColor) : bgPreview.blob
      const file = blobToFile(finalBlob, 'photo-bg.png')
      await onUploadPhoto(file)
      handleCancelBackground()
    } catch (err) {
      setBgError(err.message || 'Failed to apply background')
    } finally {
      setBgProcessing(false)
    }
  }

  function handleCancelBackground() {
    if (bgPreview) URL.revokeObjectURL(bgPreview.url)
    setBgPreview(null)
    setFillColor('')
  }

  return (
    <SectionCard title="Contact info">
      <div className="flex flex-wrap items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
          {photoUrl ? (
            <img src={getAvatarUrl(photoUrl, { size: 128 })} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              No photo
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
            <span className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
              {uploadingPhoto ? 'Uploading…' : photoUrl ? 'Change photo' : 'Upload photo'}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploadingPhoto}
              onChange={handleFileChange}
            />
          </label>
          {photoUrl && (
            <button
              type="button"
              onClick={onRemovePhoto}
              disabled={uploadingPhoto}
              className="rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {photoUrl && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          {!bgPreview ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Background removal</p>
                <p className="text-xs text-slate-500">
                  Tries ImageKit first (better quality), automatically falls back to on-device AI if that fails.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveBackground}
                disabled={bgProcessing || uploadingPhoto}
                className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {bgProcessing ? 'Processing…' : 'Remove background'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-200"
                  style={{
                    backgroundColor: fillColor || undefined,
                    backgroundImage: fillColor
                      ? undefined
                      : 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%)',
                    backgroundSize: fillColor ? undefined : '10px 10px',
                  }}
                >
                  <img src={bgPreview.url} alt="Background removed preview" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">Background removed ({SOURCE_LABEL[bgPreview.source]})</p>
                  <p className="text-xs text-slate-500">Pick a fill color, or keep it transparent, then apply.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {FILL_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.label}
                        type="button"
                        onClick={() => handlePickFill(swatch.value)}
                        title={swatch.label}
                        className={`h-6 w-6 rounded-full border-2 ${
                          fillColor === swatch.value ? 'border-indigo-600' : 'border-slate-300'
                        }`}
                        style={{
                          backgroundColor: swatch.value || undefined,
                          backgroundImage: swatch.value
                            ? undefined
                            : 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%)',
                          backgroundSize: swatch.value ? undefined : '6px 6px',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={fillColor || '#ffffff'}
                      onChange={(e) => handlePickFill(e.target.value)}
                      title="Custom color"
                      className="h-6 w-8 cursor-pointer rounded border border-slate-300 p-0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyBackground}
                  disabled={bgProcessing || uploadingPhoto}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {bgProcessing ? 'Applying…' : 'Apply'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelBackground}
                  disabled={bgProcessing}
                  className="rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {bgError && <p className="mt-2 text-xs text-red-500">{bgError}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          label="First name"
          value={contact.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
        />
        <Field
          label="Email"
          type="email"
          value={contact.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
        <Field
          label="Middle name (optional)"
          value={contact.middleName}
          onChange={(e) => onChange('middleName', e.target.value)}
        />
        <Field label="Phone" value={contact.phone} onChange={(e) => onChange('phone', e.target.value)} />
        <Field
          label="Last name"
          value={contact.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
        />
        <Field
          label="Location"
          value={contact.location}
          onChange={(e) => onChange('location', e.target.value)}
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            Profile links (LinkedIn, GitHub, LeetCode, Codeforces, anything)
          </span>
          <button
            type="button"
            onClick={onAddLink}
            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
          >
            + Add link
          </button>
        </div>
        {contact.links.length === 0 && (
          <p className="text-sm text-slate-400">No links added yet.</p>
        )}
        <div className="space-y-2">
          {contact.links.map((link, i) => {
            const isPortfolio = (link.label || '').trim().toLowerCase() === 'portfolio'
            const Icon = detectLinkIcon(link.label, link.url)
            return (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  {isPortfolio ? (
                    <InitialsIcon
                      initials={getInitials(contact.firstName, contact.lastName)}
                      className="h-5 w-5 shrink-0"
                    />
                  ) : (
                    <Icon className="h-5 w-5 shrink-0" />
                  )}
                  <input
                    value={link.label}
                    onChange={(e) => onUpdateLink(i, 'label', e.target.value)}
                    placeholder="Link name (e.g. LinkedIn)"
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none sm:w-40 sm:flex-none"
                  />
                </div>
                <input
                  value={link.url}
                  onChange={(e) => onUpdateLink(i, 'url', e.target.value)}
                  placeholder="Link value (e.g. linkedin.com/in/you)"
                  className="min-w-[160px] flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRemoveLink(i)}
                  className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}
