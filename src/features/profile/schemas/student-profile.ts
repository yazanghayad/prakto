import { z } from 'zod';

// ─── Student Profile Schema ───────────────────────────────────

export const studentProfileSchema = z.object({
  school: z.string().min(2, 'Skola måste vara minst 2 tecken.'),
  program: z.string().min(2, 'Program måste vara minst 2 tecken.'),
  educationLevel: z.enum(['yh', 'university', 'gymnasie', 'other'], {
    message: 'Välj utbildningsnivå.'
  }),
  internshipType: z.array(z.enum(['lia', 'vfu', 'apl'])).min(1, 'Välj minst en typ av praktik.'),
  city: z.string().min(2, 'Stad måste vara minst 2 tecken.'),
  skills: z.array(z.string()).min(1, 'Lägg till minst en kompetens.'),
  bio: z.string().min(10, 'Bio måste vara minst 10 tecken.'),
  linkedinUrl: z.string().url('Ange en giltig URL.').or(z.literal('')).optional(),
  cvFileId: z.string().optional()
});

export type StudentProfileFormValues = z.infer<typeof studentProfileSchema>;
