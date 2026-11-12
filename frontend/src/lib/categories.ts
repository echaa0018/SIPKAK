// The same list as backend/src/data/categories.ts (the API also serves it at /api/categories).
export type ReportCategory =
  'lighting' | 'paths' | 'toilets' | 'classroom' | 'accessibility' | 'other';

export const categories: { code: ReportCategory; label: string }[] = [
  { code: 'lighting', label: 'Lighting' },
  { code: 'paths', label: 'Roads and sidewalks' },
  { code: 'toilets', label: 'Toilets and sanitation' },
  { code: 'classroom', label: 'Classroom furniture' },
  { code: 'accessibility', label: 'Accessibility' },
  { code: 'other', label: 'Other' },
];

export const categoryLabels = Object.fromEntries(
  categories.map((c) => [c.code, c.label]),
) as Record<ReportCategory, string>;
