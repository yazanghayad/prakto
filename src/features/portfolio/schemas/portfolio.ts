import { z } from 'zod';

export const portfolioItemSchema = z.object({
  title: z.string().min(2, 'Titel måste vara minst 2 tecken.'),
  description: z
    .string()
    .min(10, 'Beskrivning måste vara minst 10 tecken.')
    .max(1000, 'Max 1000 tecken.'),
  type: z.enum(['project', 'design', 'document', 'other'], {
    message: 'Välj en typ.'
  }),
  projectUrl: z.string().url('Ange en giltig URL.').or(z.literal('')).optional(),
  githubUrl: z.string().url('Ange en giltig URL.').or(z.literal('')).optional(),
  fileIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional()
});

export type PortfolioItemFormValues = z.infer<typeof portfolioItemSchema>;
