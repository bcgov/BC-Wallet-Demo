import { describe, it, expect } from 'vitest'

import { generateUniqueSlug, slugify } from '../slug'

describe('slugify', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugify('Cool Clothes Online')).toBe('cool-clothes-online')
  })

  it('strips special characters and punctuation', () => {
    expect(slugify('Alice & Bob: Student Card!')).toBe('alice-bob-student-card')
  })

  it('collapses repeated separators and trims leading/trailing hyphens', () => {
    expect(slugify('  --Multiple   Spaces--  ')).toBe('multiple-spaces')
  })

  it('normalizes accented characters', () => {
    expect(slugify('Café Résumé')).toBe('cafe-resume')
  })
})

describe('generateUniqueSlug', () => {
  it('returns the base slug when it is free', async () => {
    const slug = await generateUniqueSlug('student', async () => false)
    expect(slug).toBe('student')
  })

  it('appends an incrementing suffix until a free slug is found', async () => {
    const taken = new Set(['student', 'student-2'])
    const slug = await generateUniqueSlug('student', async (candidate) => taken.has(candidate))
    expect(slug).toBe('student-3')
  })

  it('falls back to "showcase" when the base is empty', async () => {
    const slug = await generateUniqueSlug('', async () => false)
    expect(slug).toBe('showcase')
  })
})
