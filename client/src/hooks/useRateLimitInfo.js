import { useEffect, useState } from 'react'
import { getRateLimitInfo, subscribeRateLimitInfo } from '../api/rateLimitStore'

// Returns the most recent { limit, remaining, resetAt, tier } captured from
// an /api/analyze response's X-RateLimit-* headers, or null before any
// analyze/improve call has happened yet this session.
export function useRateLimitInfo() {
  const [info, setInfo] = useState(getRateLimitInfo())
  useEffect(() => subscribeRateLimitInfo(setInfo), [])
  return info
}
