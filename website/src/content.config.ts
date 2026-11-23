import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'

// Spec 020 FR-007: the guides come from docs/guide; the website keeps no copy.
// The id is the file name without .md (`install.uk`), see lib/guides.ts.
export const collections = {
  guides: defineCollection({
    loader: glob({
      pattern: '*.md',
      base: '../docs/guide',
      generateId: ({ entry }) => entry.replace(/\.md$/, ''),
    }),
  }),
}
