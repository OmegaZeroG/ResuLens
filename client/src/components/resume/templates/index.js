import { ResumePreview } from '../ResumePreview'
import { JakesResumeTemplate } from './JakesResumeTemplate'
import { CompactTwoColumnTemplate } from './CompactTwoColumnTemplate'
import { ModernTemplate } from './ModernTemplate'
import { HarvardTemplate } from './HarvardTemplate'

// Single source of truth for "what templates exist" — the picker UI in
// ResumeBuilder and the live preview dispatcher both read this list, so
// adding a template is one entry here (plus the component itself) rather
// than touching multiple places that need to stay in sync.
//
// `id` is stored on the resume document (Resume.template in the server
// schema) and is what exportPdf.js switches on too. All 5 locked-in
// templates (see TASKS.md Phase 8) now have both a live-preview component
// and a matching jsPDF export.
export const TEMPLATES = [
  { id: 'default', name: 'Classic', component: ResumePreview },
  { id: 'jakes-resume', name: "Jake's Resume", component: JakesResumeTemplate },
  { id: 'compact-two-column', name: 'Compact Two-Column', component: CompactTwoColumnTemplate },
  { id: 'modern', name: 'Modern', component: ModernTemplate },
  { id: 'harvard', name: 'Harvard', component: HarvardTemplate },
]

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}
