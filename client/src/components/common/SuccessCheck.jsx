// Small success-confirmation icon — a subtle "pop" animation, not a
// full-screen celebration. Used for everyday confirmations (saved,
// applied) where users take feedback for granted when it's there but
// notice its absence immediately when it's not.
export function SuccessCheck({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <svg
      className={`${sizes[size] || sizes.md} animate-[success-pop_0.4s_ease-out] text-emerald-500 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <circle cx="12" cy="12" r="10" className="opacity-15" fill="currentColor" stroke="none" />
      <path d="m7.5 12.5 3 3 6-6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
