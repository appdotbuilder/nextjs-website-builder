
import { serial, text, pgTable, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const websitesTable = pgTable('websites', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain'),
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const pagesTable = pgTable('pages', {
  id: serial('id').primaryKey(),
  website_id: integer('website_id').notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  meta_description: text('meta_description'),
  seo_title: text('seo_title'),
  seo_keywords: text('seo_keywords'),
  is_homepage: boolean('is_homepage').notNull().default(false),
  sort_order: integer('sort_order').notNull().default(0),
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const blockTemplatesTable = pgTable('block_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  default_content: jsonb('default_content').notNull(),
  settings_schema: jsonb('settings_schema').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const pageBlocksTable = pgTable('page_blocks', {
  id: serial('id').primaryKey(),
  page_id: integer('page_id').notNull(),
  block_template_id: integer('block_template_id').notNull(),
  content: jsonb('content').notNull(),
  settings: jsonb('settings').notNull(),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const assetsTable = pgTable('assets', {
  id: serial('id').primaryKey(),
  website_id: integer('website_id').notNull(),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  mime_type: text('mime_type').notNull(),
  file_size: integer('file_size').notNull(),
  url: text('url').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const websitesRelations = relations(websitesTable, ({ many }) => ({
  pages: many(pagesTable),
  assets: many(assetsTable),
}));

export const pagesRelations = relations(pagesTable, ({ one, many }) => ({
  website: one(websitesTable, {
    fields: [pagesTable.website_id],
    references: [websitesTable.id],
  }),
  blocks: many(pageBlocksTable),
}));

export const blockTemplatesRelations = relations(blockTemplatesTable, ({ many }) => ({
  pageBlocks: many(pageBlocksTable),
}));

export const pageBlocksRelations = relations(pageBlocksTable, ({ one }) => ({
  page: one(pagesTable, {
    fields: [pageBlocksTable.page_id],
    references: [pagesTable.id],
  }),
  blockTemplate: one(blockTemplatesTable, {
    fields: [pageBlocksTable.block_template_id],
    references: [blockTemplatesTable.id],
  }),
}));

export const assetsRelations = relations(assetsTable, ({ one }) => ({
  website: one(websitesTable, {
    fields: [assetsTable.website_id],
    references: [websitesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Website = typeof websitesTable.$inferSelect;
export type NewWebsite = typeof websitesTable.$inferInsert;
export type Page = typeof pagesTable.$inferSelect;
export type NewPage = typeof pagesTable.$inferInsert;
export type BlockTemplate = typeof blockTemplatesTable.$inferSelect;
export type NewBlockTemplate = typeof blockTemplatesTable.$inferInsert;
export type PageBlock = typeof pageBlocksTable.$inferSelect;
export type NewPageBlock = typeof pageBlocksTable.$inferInsert;
export type Asset = typeof assetsTable.$inferSelect;
export type NewAsset = typeof assetsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  websites: websitesTable,
  pages: pagesTable,
  blockTemplates: blockTemplatesTable,
  pageBlocks: pageBlocksTable,
  assets: assetsTable,
};
