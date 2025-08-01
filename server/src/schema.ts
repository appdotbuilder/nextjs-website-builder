
import { z } from 'zod';

// Website schema
export const websiteSchema = z.object({
  id: z.number(),
  name: z.string(),
  domain: z.string().nullable(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Website = z.infer<typeof websiteSchema>;

// Page schema
export const pageSchema = z.object({
  id: z.number(),
  website_id: z.number(),
  title: z.string(),
  slug: z.string(),
  meta_description: z.string().nullable(),
  seo_title: z.string().nullable(),
  seo_keywords: z.string().nullable(),
  is_homepage: z.boolean(),
  sort_order: z.number().int(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Page = z.infer<typeof pageSchema>;

// Block template schema
export const blockTemplateSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  default_content: z.record(z.any()), // JSON object for default content
  settings_schema: z.record(z.any()), // JSON schema for block settings
  created_at: z.coerce.date()
});

export type BlockTemplate = z.infer<typeof blockTemplateSchema>;

// Page block schema (instances of blocks on pages)
export const pageBlockSchema = z.object({
  id: z.number(),
  page_id: z.number(),
  block_template_id: z.number(),
  content: z.record(z.any()), // JSON object for customized content
  settings: z.record(z.any()), // JSON object for block settings
  sort_order: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PageBlock = z.infer<typeof pageBlockSchema>;

// Asset schema for uploaded images/files
export const assetSchema = z.object({
  id: z.number(),
  website_id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  file_size: z.number().int(),
  url: z.string(),
  created_at: z.coerce.date()
});

export type Asset = z.infer<typeof assetSchema>;

// Input schemas for creating/updating entities
export const createWebsiteInputSchema = z.object({
  name: z.string().min(1),
  domain: z.string().nullable()
});

export type CreateWebsiteInput = z.infer<typeof createWebsiteInputSchema>;

export const updateWebsiteInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  domain: z.string().nullable().optional(),
  is_published: z.boolean().optional()
});

export type UpdateWebsiteInput = z.infer<typeof updateWebsiteInputSchema>;

export const createPageInputSchema = z.object({
  website_id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  meta_description: z.string().nullable(),
  seo_title: z.string().nullable(),
  seo_keywords: z.string().nullable(),
  is_homepage: z.boolean().optional()
});

export type CreatePageInput = z.infer<typeof createPageInputSchema>;

export const updatePageInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  meta_description: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_keywords: z.string().nullable().optional(),
  is_homepage: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  is_published: z.boolean().optional()
});

export type UpdatePageInput = z.infer<typeof updatePageInputSchema>;

export const createPageBlockInputSchema = z.object({
  page_id: z.number(),
  block_template_id: z.number(),
  content: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  sort_order: z.number().int().optional()
});

export type CreatePageBlockInput = z.infer<typeof createPageBlockInputSchema>;

export const updatePageBlockInputSchema = z.object({
  id: z.number(),
  content: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  sort_order: z.number().int().optional()
});

export type UpdatePageBlockInput = z.infer<typeof updatePageBlockInputSchema>;

export const createAssetInputSchema = z.object({
  website_id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  file_size: z.number().int().nonnegative(),
  url: z.string()
});

export type CreateAssetInput = z.infer<typeof createAssetInputSchema>;

// Export website data schema
export const websiteExportSchema = z.object({
  website: websiteSchema,
  pages: z.array(pageSchema),
  blocks: z.array(pageBlockSchema),
  assets: z.array(assetSchema)
});

export type WebsiteExport = z.infer<typeof websiteExportSchema>;
