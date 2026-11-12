// The kinds of damage SIPKAK takes, from the scope in the report (Chapter I).
// "other" is for anything else, and for reports saved before categories existed.
// The frontend keeps the same list in frontend/src/lib/categories.ts.
export const categories = [
  { code: 'lighting', label: 'Lighting' },
  { code: 'paths', label: 'Roads and sidewalks' },
  { code: 'toilets', label: 'Toilets and sanitation' },
  { code: 'classroom', label: 'Classroom furniture' },
  { code: 'accessibility', label: 'Accessibility' },
  { code: 'other', label: 'Other' },
] as const;

export type ReportCategory = (typeof categories)[number]['code'];

export const categoryCodes = categories.map((c) => c.code) as [ReportCategory, ...ReportCategory[]];
