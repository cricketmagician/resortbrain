// modules/menu/schema.ts
// Zod schemas and TypeScript contracts for the Menu domain

import { z } from 'zod';

export const MenuItemSchema = z.object({
  id: z.string(),
  hotel_id: z.string(),
  category: z.string(),
  name: z.string().min(2).max(255),
  description: z.string().optional(),
  price_paise: z.number().int().positive('Price must be positive minor units (paise)'),
  image_url: z.string().url().optional(),
  is_veg: z.boolean().default(true),
  allergen_tags: z.array(z.string()).default([]),
  is_available: z.boolean().default(true),
});

export const MenuFilterSchema = z.object({
  hotelId: z.string(),
  category: z.string().optional(),
  vegOnly: z.boolean().optional(),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuFilter = z.infer<typeof MenuFilterSchema>;
