import { Field, SectionCard } from './Field'

export function ContactSection({
  contact,
  onChange,
  photoUrl,
  onUploadPhoto,
  onRemovePhoto,
  uploadingPhoto,
}) {
  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) onUploadPhoto(file)
    e.target.value = '' // allow re-selecting the same file later
  }

  return (
    <SectionCard title="Contact info">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
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

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Full name"
          value={contact.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
        />
        <Field
          label="Email"
          type="email"
          value={contact.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
        <Field label="Phone" value={contact.phone} onChange={(e) => onChange('phone', e.target.value)} />
        <Field
          label="Location"
          value={contact.location}
          onChange={(e) => onChange('location', e.target.value)}
        />
        <Field
          label="LinkedIn"
          value={contact.linkedin}
          onChange={(e) => onChange('linkedin', e.target.value)}
        />
        <Field
          label="Portfolio / GitHub"
          value={contact.portfolio}
          onChange={(e) => onChange('portfolio', e.target.value)}
        />
      </div>
    </SectionCard>
  )
}
