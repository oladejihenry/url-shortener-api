import { z } from 'zod';

export const urlSchema = z.object({
  url: z.string().url('Invalid URL'),
  expiresIn: z.number().optional(),
});

export type UrlSchema = z.infer<typeof urlSchema>;
