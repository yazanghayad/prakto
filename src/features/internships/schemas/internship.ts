import { z } from 'zod';

// ─── Step 1: Berätta om rollen ─────────────────────────────────

export const internshipStep1Schema = z.object({
  title: z.string().min(5, 'Titel måste vara minst 5 tecken.'),
  description: z.string().min(30, 'Beskrivning måste vara minst 30 tecken.'),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  preferredQualifications: z.string().optional(),
  field: z.string().min(1, 'Välj ett område.'),
  internshipType: z.enum(['lia', 'vfu', 'apl'], {
    message: 'Välj typ av praktik.'
  }),
  city: z.string().min(2, 'Stad måste vara minst 2 tecken.'),
  workplaceType: z.enum(['on_site', 'remote', 'hybrid'], {
    message: 'Välj arbetsplatstyp.'
  }),
  duration: z.string().optional(),
  spots: z.number({ message: 'Antal platser krävs.' }).min(1, 'Minst 1 plats.'),
  startDate: z.string().optional(),
  applicationDeadline: z.string().optional()
});

// ─── Step 2: Få kvalificerade sökande ──────────────────────────

export const internshipStep2Schema = z.object({
  applicationMethod: z.string().min(1, 'Välj insamlingsmetod.'),
  contactEmail: z.string().min(1, 'E-postadress krävs.'),
  cvRequired: z.boolean().optional(),
  coverLetterRequired: z.boolean().optional(),
  screeningQuestions: z.array(z.string()).optional(),
  educationLevel: z.string().optional(),
  rejectionMessage: z.string().optional()
});

// ─── Combined schema ──────────────────────────────────────────

export const internshipSchema = internshipStep1Schema.merge(internshipStep2Schema);

export type InternshipFormValues = z.infer<typeof internshipSchema>;

// Legacy compatibility
export type InternshipStep1Values = z.infer<typeof internshipStep1Schema>;
export type InternshipStep2Values = z.infer<typeof internshipStep2Schema>;
