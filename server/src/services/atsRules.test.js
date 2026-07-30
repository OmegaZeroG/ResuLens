import { describe, it, expect } from 'vitest'
import { runAtsRuleChecks } from './atsRules.js'

describe('runAtsRuleChecks', () => {
  it('scores a well-formed saved resume at 100', () => {
    const sections = {
      experience: [{ bullets: ['Did a thing', 'Did another thing'] }],
      education: [{ school: 'X' }],
      skills: ['JS', 'React'],
      projects: [],
    }
    const text = 'John Doe john@example.com (555) 123-4567 ' + 'word '.repeat(300)
    const result = runAtsRuleChecks({ resumeText: text, sections, resumeSource: 'saved' })

    expect(result.score).toBe(100)
    expect(result.checks.every((c) => c.pass)).toBe(true)
    // Saved resumes never get the extractable_text check — a resume built
    // and exported through ResuLens's own PDF generator always has real text.
    expect(result.checks.some((c) => c.id === 'extractable_text')).toBe(false)
  })

  it('caps the score low for an upload with no real extractable text (scanned image case)', () => {
    const result = runAtsRuleChecks({ resumeText: '   ', sections: null, resumeSource: 'upload' })

    expect(result.checks.find((c) => c.id === 'extractable_text').pass).toBe(false)
    expect(result.score).toBeLessThanOrEqual(20)
  })

  it('fails contact_info and standard_sections when neither is present, even with plenty of real text', () => {
    const text = 'This describes a career in general terms with no headings or contact details. '.repeat(10)
    const result = runAtsRuleChecks({ resumeText: text, sections: null, resumeSource: 'upload' })

    expect(result.checks.find((c) => c.id === 'extractable_text').pass).toBe(true)
    expect(result.checks.find((c) => c.id === 'contact_info').pass).toBe(false)
    expect(result.checks.find((c) => c.id === 'standard_sections').pass).toBe(false)
  })

  it('detects an email and phone number in plain extracted text', () => {
    const result = runAtsRuleChecks({
      resumeText: 'Reach me at jane@example.com or 555-123-4567. ' + 'word '.repeat(150),
      sections: null,
      resumeSource: 'upload',
    })
    expect(result.checks.find((c) => c.id === 'contact_info').pass).toBe(true)
  })

  it('detects standard section keywords in plain text', () => {
    const result = runAtsRuleChecks({
      resumeText: 'Experience: did things. Education: studied things. Skills: knows things. ' + 'word '.repeat(150),
      sections: null,
      resumeSource: 'upload',
    })
    expect(result.checks.find((c) => c.id === 'standard_sections').pass).toBe(true)
  })

  it('trusts structured sections directly for a saved resume, ignoring text heuristics', () => {
    // Text alone gives no keyword hints, but the structured sections say
    // otherwise — saved-resume checks must use the structured data, not text.
    const sections = {
      experience: [{ bullets: ['x'] }],
      education: [{ school: 'x' }],
      skills: ['x'],
      projects: [],
    }
    const text = 'no recognizable headings here at all ' + 'word '.repeat(150)
    const result = runAtsRuleChecks({ resumeText: text, sections, resumeSource: 'saved' })
    expect(result.checks.find((c) => c.id === 'standard_sections').pass).toBe(true)
  })

  it('flags a resume with no bullet points', () => {
    const result = runAtsRuleChecks({
      resumeText:
        'jane@x.com 555-123-4567 experience education skills ' + 'word '.repeat(150) + ' no bullets anywhere here',
      sections: null,
      resumeSource: 'upload',
    })
    expect(result.checks.find((c) => c.id === 'bullet_usage').pass).toBe(false)
  })

  it('flags a resume that is too short', () => {
    const result = runAtsRuleChecks({
      resumeText: 'jane@x.com 555-123-4567 experience education skills short resume',
      sections: null,
      resumeSource: 'upload',
    })
    expect(result.checks.find((c) => c.id === 'resume_length').pass).toBe(false)
  })

  it('flags emoji/decorative characters', () => {
    const result = runAtsRuleChecks({
      resumeText: 'jane@x.com 5551234567 experience education skills 🚀🔥✨ ' + 'word '.repeat(200),
      sections: null,
      resumeSource: 'upload',
    })
    const check = result.checks.find((c) => c.id === 'no_problematic_characters')
    expect(check.pass).toBe(false)
  })

  it('computes the weighted score correctly for a mixed pass/fail case', () => {
    const text = 'jane@x.com 5551234567 experience education skills 🚀🔥✨ ' + 'word '.repeat(200)
    const result = runAtsRuleChecks({ resumeText: text, sections: null, resumeSource: 'upload' })
    // extractable_text(25) + contact_info(20) + standard_sections(25) + resume_length(10) pass;
    // bullet_usage(15) + no_problematic_characters(5) fail. 80/100 = 80.
    expect(result.score).toBe(80)
  })
})
