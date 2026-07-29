// Icon + real HTML text, not the flattened LOGO+title.svg combo image — a
// baked-in SVG lockup doesn't scale cleanly at arbitrary header heights (the
// icon and wordmark were fighting each other at h-9). This scales properly
// and stays crisp at any size, and reuses the same icon file everywhere.
export function Logo({ size = 'md', className = '' }) {
  const sizes = {
    sm: { icon: 'h-6 w-6', text: 'text-base' },
    md: { icon: 'h-8 w-8', text: 'text-xl' },
    lg: { icon: 'h-11 w-11', text: 'text-2xl' },
  }
  const { icon, text } = sizes[size] || sizes.md

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/LOGO.svg" alt="" className={`${icon} shrink-0`} />
      <span className={`font-extrabold tracking-tight text-slate-900 ${text}`}>
        Resu<span className="text-indigo-600">Lens</span>
      </span>
    </span>
  )
}
