// First + last initials only — deliberately never the middle name, per how
// initials are conventionally written (e.g. "Om Rajesh Pathrabe" -> "OP",
// not "ORP").
export function getInitials(firstName, lastName) {
  const first = (firstName || '').trim()[0] || ''
  const last = (lastName || '').trim()[0] || ''
  return (first + last).toUpperCase()
}
