import { z } from 'zod';

export const companyProfileSchema = z.object({
  companyName: z.string().min(2, 'Företagsnamn måste vara minst 2 tecken.'),
  orgNumber: z
    .string()
    .min(10, 'Organisationsnummer måste vara minst 10 tecken.')
    .max(13, 'Organisationsnummer får inte överstiga 13 tecken.'),
  industry: z.string().min(1, 'Välj en bransch.'),
  description: z.string().min(20, 'Beskrivning måste vara minst 20 tecken.'),
  website: z.string().url('Ange en giltig URL.').or(z.literal('')).optional(),
  city: z.string().min(2, 'Stad måste vara minst 2 tecken.'),
  contactEmail: z.string().email('Ange en giltig e-postadress.'),
  contactPhone: z.string().optional()
});

export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;
