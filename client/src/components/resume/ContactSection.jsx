import { Field, SectionCard } from './Field'
import { detectLinkIcon, InitialsIcon } from '../common/icons'
import { getInitials } from '../../utils/name'
import { getAvatarUrl } from '../../utils/imagekitTransform'

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

      <div className="grid grid-cols-2 gap-3">
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
              <div key={i} className="flex items-center gap-2">
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
                  className="w-40 shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
                />
                <input
                  value={link.url}
                  onChange={(e) => onUpdateLink(i, 'url', e.target.value)}
                  placeholder="Link value (e.g. linkedin.com/in/you)"
                  className="flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
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
