export const eventTypeOptions = [
  { value: 'interview', label: 'Intervju' },
  { value: 'meeting', label: 'Möte' },
  { value: 'reminder', label: 'Påminnelse' },
  { value: 'other', label: 'Övrigt' }
];

export const eventTypeLabels: Record<string, string> = {
  interview: 'Intervju',
  meeting: 'Möte',
  reminder: 'Påminnelse',
  other: 'Övrigt'
};

export const eventStatusLabels: Record<string, string> = {
  scheduled: 'Schemalagd',
  completed: 'Avslutad',
  cancelled: 'Avbokad'
};

export const dayOfWeekLabels: Record<string, string> = {
  monday: 'Måndag',
  tuesday: 'Tisdag',
  wednesday: 'Onsdag',
  thursday: 'Torsdag',
  friday: 'Fredag',
  saturday: 'Lördag',
  sunday: 'Söndag'
};

export const dayOfWeekOptions = [
  { value: 'monday', label: 'Måndag' },
  { value: 'tuesday', label: 'Tisdag' },
  { value: 'wednesday', label: 'Onsdag' },
  { value: 'thursday', label: 'Torsdag' },
  { value: 'friday', label: 'Fredag' },
  { value: 'saturday', label: 'Lördag' },
  { value: 'sunday', label: 'Söndag' }
];

export const eventTypeColors: Record<string, string> = {
  interview: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  meeting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  reminder: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
};
