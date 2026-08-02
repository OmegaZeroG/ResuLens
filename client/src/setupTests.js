// Runs once before the test suite — adds jest-dom's matchers
// (toBeInTheDocument, toBeDisabled, etc.) to vitest's `expect`.
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// @testing-library/react's auto-cleanup only self-registers when it finds a
// global `afterEach` — this project's vitest config doesn't set `globals:
// true` (test files import describe/it/expect explicitly, same as the
// server suite), so that auto-detection never fires. Without this, every
// `render()` call would keep appending to `document.body` and tests in the
// same file would start seeing each other's leftover DOM.
afterEach(() => {
  cleanup()
})
