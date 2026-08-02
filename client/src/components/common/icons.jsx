// Small inline icon set shared across the app (resume preview contact line,
// project links, etc). Kept as plain inline SVG — no icon library dependency,
// same approach already used for the Google/GitHub buttons on the auth page.
// Line icons use `currentColor` so they inherit whatever text color they're
// placed next to; brand icons (LinkedIn, GitHub, LeetCode) use fixed brand
// colors so they stay recognizable regardless of surrounding text color.

// ─── Base icons — used directly by ResumePreview/ContactSection and also
// referenced inside detectLinkIcon below. Restored after they got dropped in
// a manual edit that kept only the new platform icons. ───

// App-chrome icons (mobile nav toggles) — same inline-SVG approach, just not
// tied to a specific link/platform like the rest of this file.
export function MenuIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  )
}

export function MailIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m3 6 9 6 9-6" />
    </svg>
  )
}

export function PhoneIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  )
}

export function MapPinIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function LinkIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

export function LinkedinIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#0A66C2" aria-hidden="true">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.03-1.85-3.03-1.86 0-2.15 1.45-2.15 2.94v5.66H9.35V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  )
}

export function GithubIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.12 3.06.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
    </svg>
  )
}

// LeetCode's actual mark is a stylized square-bracket knight logo that's
// awkward to reproduce accurately as a tiny hand-written SVG — a simple
// monogram badge in their brand orange is a safer, still-recognizable stand-in.
export function LeetcodeIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#FFA116" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily="Arial, sans-serif" fill="#1A1A1A">
        LC
      </text>
    </svg>
  )
}

// Codeforces' real mark is a gradient swirl "C" — same monogram treatment.
export function CodeforcesIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#1F8ACB" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fontFamily="Arial, sans-serif" fill="#FFFFFF">
        CF
      </text>
    </svg>
  )
}

// ─── Additional coding-platform icons (monogram badge style, same treatment as LeetCode/Codeforces) ───

export function GitlabIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#FC6D26" aria-hidden="true">
      <path d="M12 21.42 15.77 10H8.23L12 21.42Z" />
      <path d="M12 21.42 8.23 10H2.5l1.4 4.3L12 21.42Z" opacity="0.9" />
      <path d="M12 21.42 15.77 10h5.73l-1.4 4.3L12 21.42Z" opacity="0.9" />
      <path d="M2.5 10 1.06 14.34a.9.9 0 0 0 .33 1.01L12 21.42 2.5 10Z" opacity="0.7" />
      <path d="M2.5 10h5.73L6.2 2.4a.45.45 0 0 0-.86 0L2.5 10Z" />
      <path d="M21.5 10 22.94 14.34a.9.9 0 0 1-.33 1.01L12 21.42 21.5 10Z" opacity="0.7" />
      <path d="M21.5 10h-5.73L17.8 2.4a.45.45 0 0 1 .86 0L21.5 10Z" />
    </svg>
  )
}

export function HackerrankIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="11" fill="#00EA64" />
      <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif" fill="#1A1A1A">
        HR
      </text>
    </svg>
  )
}

export function GfgIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#2F8D46" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif" fill="#FFFFFF">
        GFG
      </text>
    </svg>
  )
}

export function CodechefIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#5B4638" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial, sans-serif" fill="#FFFFFF">
        CC
      </text>
    </svg>
  )
}

export function KaggleIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#20BEFF" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif" fill="#FFFFFF">
        K
      </text>
    </svg>
  )
}

// ─── Writing / blogging (monogram, same reasoning as above — real marks are wordmarks/glyphs not worth hand-tracing) ───

export function MediumIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#000000" aria-hidden="true">
      <path d="M13.54 12a6.72 6.72 0 0 1-6.72 6.72A6.72 6.72 0 0 1 .1 12a6.72 6.72 0 0 1 6.72-6.72A6.72 6.72 0 0 1 13.54 12Zm7.32 0c0 3.54-1.5 6.42-3.36 6.42s-3.36-2.88-3.36-6.42 1.5-6.42 3.36-6.42 3.36 2.87 3.36 6.42Zm2.14 0c0 3.17-.53 5.75-1.18 5.75s-1.18-2.57-1.18-5.75.53-5.75 1.18-5.75 1.18 2.57 1.18 5.75Z" />
    </svg>
  )
}

export function DevtoIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#000000" aria-hidden="true">
      <path d="M4.5 8.5h2.7c1.3 0 2 .8 2 2v3c0 1.2-.7 2-2 2H4.5v-7Zm1.5 1.3v4.4h1c.5 0 .7-.2.7-.7v-3c0-.5-.2-.7-.7-.7h-1Zm5-1.3h4.3v1.3h-2.8v1.5h2.3v1.3h-2.3v1.6h2.8V16H11v-7.5Zm5.4 0h1.6l1.3 5 1.3-5h1.6l-2.1 7.5h-1.6l-2.1-7.5Z" />
    </svg>
  )
}

export function HashnodeIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="8" fill="#2962FF" />
      <path d="M12 6.5 17.5 12 12 17.5 6.5 12 12 6.5Z" fill="#FFFFFF" />
    </svg>
  )
}

export function SubstackIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#FF6719" aria-hidden="true">
      <rect x="3" y="3" width="18" height="3.2" />
      <rect x="3" y="8" width="18" height="3.2" />
      <path d="M3 13.5h18v2.3L12 21l-9-5.2v-2.3Z" />
    </svg>
  )
}

// ─── Social ───

export function TwitterIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#000000" aria-hidden="true">
      <path d="M18.24 2.25h3.3l-7.2 8.23 8.47 11.27h-6.63l-5.2-6.8-5.94 6.8H1.74l7.7-8.8L1.34 2.25h6.8l4.7 6.22 5.4-6.22Zm-1.16 17.5h1.83L7.02 4.13H5.06l12.02 15.62Z" />
    </svg>
  )
}

export function InstagramIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="#E4405F" strokeWidth="2" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="#E4405F" stroke="none" />
    </svg>
  )
}

export function YoutubeIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#FF0000" aria-hidden="true">
      <rect x="1" y="5" width="22" height="14" rx="4" />
      <path d="M10 9.5v5l4.5-2.5-4.5-2.5Z" fill="#FFFFFF" />
    </svg>
  )
}

export function BehanceIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#1769FF" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fontFamily="Arial, sans-serif" fill="#FFFFFF">
        Be
      </text>
    </svg>
  )
}

export function DribbbleIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#EA4C89" aria-hidden="true">
      <circle cx="12" cy="12" r="11" />
      <path d="M4.5 8.3c2.6 1.1 5.6 1.7 8.7 1.7 1.8 0 3.6-.2 5.2-.6M3.1 13.5c3.4-.7 7.4-.4 10.9.9 1.6.6 3 1.4 4.2 2.3M9 3.4c1.9 2.5 3.3 5.6 4 8.9.5 2.3.6 4.7.3 6.9" fill="none" stroke="#FFFFFF" strokeWidth="1.2" />
    </svg>
  )
}

export function StackoverflowIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="#F58025" aria-hidden="true">
      <path d="M17.36 20.2v-5.4h1.8V22H4.86v-7.2h1.8v5.4h10.7Z" />
      <path d="M8.4 14.2h8.2v-1.8H8.4v1.8Zm.24-3.5 8-1.68-.37-1.77-8 1.68.37 1.77Zm.9-3.5 7.4-3.44-.75-1.63-7.4 3.44.75 1.63Zm2.2-3.7 5.9-4.9L16.5.1l-5.9 4.9 1.14 1.5Z" />
    </svg>
  )
}

// ─── Fallback: generic personal site ───

export function GlobeIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
    </svg>
  )
}

// A "Portfolio" link is personal, not a platform — there's no brand mark for
// it, so it gets the candidate's own initials (first + last, never the
// middle name) as a monogram badge instead, same treatment as the
// LeetCode/Codeforces badges above. `initials` is dynamic, unlike the fixed
// icons, so this isn't picked by detectLinkIcon — the render site substitutes
// it in directly once it knows the label is "Portfolio".
export function InitialsIcon({ initials, className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="5" fill="#4F46E5" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fontSize={initials?.length > 1 ? 9.5 : 12}
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#FFFFFF"
      >
        {initials}
      </text>
    </svg>
  )
}

export function detectLinkIcon(label, url) {
  const text = `${label || ''} ${url || ''}`.toLowerCase()

  if (text.includes('linkedin')) return LinkedinIcon
  if (text.includes('github')) return GithubIcon
  if (text.includes('gitlab')) return GitlabIcon
  if (text.includes('leetcode')) return LeetcodeIcon
  if (text.includes('codeforces')) return CodeforcesIcon
  if (text.includes('hackerrank')) return HackerrankIcon
  if (text.includes('geeksforgeeks') || text.includes('gfg')) return GfgIcon
  if (text.includes('codechef')) return CodechefIcon
  if (text.includes('kaggle')) return KaggleIcon

  if (text.includes('medium')) return MediumIcon
  if (text.includes('dev.to') || text.includes('devto')) return DevtoIcon
  if (text.includes('hashnode')) return HashnodeIcon
  if (text.includes('substack')) return SubstackIcon

  if (text.includes('twitter') || text.includes('x.com')) return TwitterIcon
  if (text.includes('instagram')) return InstagramIcon
  if (text.includes('youtube')) return YoutubeIcon
  if (text.includes('behance')) return BehanceIcon
  if (text.includes('dribbble')) return DribbbleIcon
  if (text.includes('stackoverflow')) return StackoverflowIcon

  if (text.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((url || '').trim())) return MailIcon
  if (text.startsWith('tel:') || /^\+?\d[\d\s-]{7,}$/.test(url || '')) return PhoneIcon

  if (text.includes('portfolio') || url?.includes('.dev') || url?.includes('.me')) return GlobeIcon

  return LinkIcon
}