
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, blockTemplatesTable, pageBlocksTable } from '../db/schema';
import { deletePageBlock } from '../handlers/delete_page_block';
import { eq } from 'drizzle-orm';

describe('deletePageBlock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing page block', async () => {
    // Create prerequisite data
    const website = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    const page = await db.insert(pagesTable)
      .values({
        website_id: website[0].id,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();

    const blockTemplate = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block Template',
        category: 'content',
        description: null,
        default_content: {},
        settings_schema: {}
      })
      .returning()
      .execute();

    const pageBlock = await db.insert(pageBlocksTable)
      .values({
        page_id: page[0].id,
        block_template_id: blockTemplate[0].id,
        content: { text: 'Test content' },
        settings: { theme: 'default' },
        sort_order: 1
      })
      .returning()
      .execute();

    // Delete the page block
    const result = await deletePageBlock(pageBlock[0].id);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify block no longer exists in database
    const remainingBlocks = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.id, pageBlock[0].id))
      .execute();

    expect(remainingBlocks).toHaveLength(0);
  });

  it('should return false when deleting non-existent page block', async () => {
    const nonExistentId = 999999;

    const result = await deletePageBlock(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should not affect other page blocks when deleting one', async () => {
    // Create prerequisite data
    const website = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    const page = await db.insert(pagesTable)
      .values({
        website_id: website[0].id,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();

    const blockTemplate = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block Template',
        category: 'content',
        description: null,
        default_content: {},
        settings_schema: {}
      })
      .returning()
      .execute();

    // Create multiple page blocks
    const pageBlock1 = await db.insert(pageBlocksTable)
      .values({
        page_id: page[0].id,
        block_template_id: blockTemplate[0].id,
        content: { text: 'First block content' },
        settings: { theme: 'default' },
        sort_order: 1
      })
      .returning()
      .execute();

    const pageBlock2 = await db.insert(pageBlocksTable)
      .values({
        page_id: page[0].id,
        block_template_id: blockTemplate[0].id,
        content: { text: 'Second block content' },
        settings: { theme: 'dark' },
        sort_order: 2
      })
      .returning()
      .execute();

    // Delete only the first page block
    const result = await deletePageBlock(pageBlock1[0].id);

    expect(result.success).toBe(true);

    // Verify first block is deleted
    const deletedBlock = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.id, pageBlock1[0].id))
      .execute();

    expect(deletedBlock).toHaveLength(0);

    // Verify second block still exists
    const remainingBlock = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.id, pageBlock2[0].id))
      .execute();

    expect(remainingBlock).toHaveLength(1);
    expect(remainingBlock[0].content).toEqual({ text: 'Second block content' });
    expect(remainingBlock[0].settings).toEqual({ theme: 'dark' });
  });
});
