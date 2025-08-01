
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, pageBlocksTable, blockTemplatesTable } from '../db/schema';
import { type CreateWebsiteInput, type CreatePageInput } from '../schema';
import { deletePage } from '../handlers/delete_page';
import { eq } from 'drizzle-orm';

// Test data
const testWebsite: CreateWebsiteInput = {
  name: 'Test Website',
  domain: 'example.com'
};

const testPage: CreatePageInput = {
  website_id: 1,
  title: 'Test Page',
  slug: 'test-page',
  meta_description: 'A test page',
  seo_title: 'Test Page SEO',
  seo_keywords: 'test, page',
  is_homepage: false
};

const testBlockTemplate = {
  name: 'Test Block',
  category: 'content',
  description: 'A test block template',
  default_content: { text: 'Default content' },
  settings_schema: { type: 'object' }
};

describe('deletePage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a page successfully', async () => {
    // Create prerequisite data
    await db.insert(websitesTable).values(testWebsite).execute();
    const pageResult = await db.insert(pagesTable).values(testPage).returning().execute();
    const pageId = pageResult[0].id;

    const result = await deletePage(pageId);

    expect(result.success).toBe(true);

    // Verify page is deleted from database
    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, pageId))
      .execute();

    expect(pages).toHaveLength(0);
  });

  it('should delete page blocks when deleting a page', async () => {
    // Create prerequisite data
    await db.insert(websitesTable).values(testWebsite).execute();
    const pageResult = await db.insert(pagesTable).values(testPage).returning().execute();
    const pageId = pageResult[0].id;

    await db.insert(blockTemplatesTable).values(testBlockTemplate).execute();
    await db.insert(pageBlocksTable).values({
      page_id: pageId,
      block_template_id: 1,
      content: { text: 'Custom content' },
      settings: { visible: true },
      sort_order: 1
    }).execute();

    // Verify page block exists before deletion
    const blocksBefore = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, pageId))
      .execute();
    expect(blocksBefore).toHaveLength(1);

    const result = await deletePage(pageId);

    expect(result.success).toBe(true);

    // Verify page blocks are also deleted
    const blocksAfter = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, pageId))
      .execute();
    expect(blocksAfter).toHaveLength(0);

    // Verify page is deleted
    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, pageId))
      .execute();
    expect(pages).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent page', async () => {
    const result = await deletePage(999);

    expect(result.success).toBe(false);
  });

  it('should delete multiple page blocks associated with the page', async () => {
    // Create prerequisite data
    await db.insert(websitesTable).values(testWebsite).execute();
    const pageResult = await db.insert(pagesTable).values(testPage).returning().execute();
    const pageId = pageResult[0].id;

    await db.insert(blockTemplatesTable).values(testBlockTemplate).execute();

    // Create multiple page blocks
    await db.insert(pageBlocksTable).values([
      {
        page_id: pageId,
        block_template_id: 1,
        content: { text: 'Custom content 1' },
        settings: { visible: true },
        sort_order: 1
      },
      {
        page_id: pageId,
        block_template_id: 1,
        content: { text: 'Custom content 2' },
        settings: { visible: true },
        sort_order: 2
      },
      {
        page_id: pageId,
        block_template_id: 1,
        content: { text: 'Custom content 3' },
        settings: { visible: true },
        sort_order: 3
      }
    ]).execute();

    // Verify all blocks exist before deletion
    const blocksBefore = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, pageId))
      .execute();
    expect(blocksBefore).toHaveLength(3);

    const result = await deletePage(pageId);

    expect(result.success).toBe(true);

    // Verify all page blocks are deleted
    const blocksAfter = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, pageId))
      .execute();
    expect(blocksAfter).toHaveLength(0);
  });
});
