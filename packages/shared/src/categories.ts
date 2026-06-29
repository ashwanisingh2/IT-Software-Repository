export const SOFTWARE_CATEGORIES = [
  'Development',
  'Utilities',
  'Browsers',
  'Communication',
  'Security',
  'Media',
  'Productivity',
  'System',
  'Other'
] as const;

export type SoftwareCategory = typeof SOFTWARE_CATEGORIES[number];
