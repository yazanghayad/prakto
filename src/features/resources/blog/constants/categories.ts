export const blogCategories = [
  { value: 'tips', label: 'Tips & råd' },
  { value: 'karriar', label: 'Karriär' },
  { value: 'intervju', label: 'Intervjutips' },
  { value: 'cv', label: 'CV-tips' },
  { value: 'brev', label: 'Personligt brev' },
  { value: 'inspiration', label: 'Inspiration' }
] as const;

export const categoryLabels: Record<string, string> = {
  tips: 'Tips & råd',
  karriar: 'Karriär',
  intervju: 'Intervjutips',
  cv: 'CV-tips',
  brev: 'Personligt brev',
  inspiration: 'Inspiration'
};
