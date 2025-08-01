
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, blockTemplatesTable, pageBlocksTable } from '../db/schema';
import { type UpdatePageBlockInput } from '../schema';
import { updatePageBlock } from '../handlers/update_page_block';
import { eq } from 'drizzle-orm';

describe('updatePageBlock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update page block content and settings', async () => {
    // Create prerequisite data
    const website = await db.insert(websitesTable)
      .values({ name: 'Test Website' })
      .returning()
      .execute();

    const page = await db.insert(pagesTable)
      .values({
        website_id: website[0].id,
        title: 'Test Page',
        slug: 'test-page'
      })
      .returning()
      .execute();

    const blockTemplate = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block',
        category: 'content',
        default_content: { text: 'default' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    const pageBlock = await db.insert(pageBlocksTable)
      .values({
        page_id: page[0].id,
        block_template_id: blockTemplate[0].id,
        content: { text: 'original content' },
        settings: { color: 'blue' },
        sort_order: 1
      })
      .returning()
      .execute();

    const updateInput: UpdatePageBlockInput = {
      id: pageBlock[0].id,
      content: { text: 'updated content', heading: 'New Heading' },
      settings: { color: 'red', fontSize: 16 },
      sort_order: 2
    };

    const result = await updatePageBlock(updateInput);

    expect(result.id).toEqual(pageBlock[0].id);
    expect(result.content).toEqual({ text: 'updated content', heading: 'New Heading' });
    expect(result.settings).toEqual({ color: 'red', fontSize: 16 });
    expect(result.sort_order).toEqual(2);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > pageBlock[0].updated_at).toBe(true);
  });

  it('should update only provided fields', async () => {
    // Create prerequisite data
    const website = await db.insert(websitesTable)
      .values({ name: 'Test Website' })
      .returning()
      .execute();

    const page = await db.insert(pagesTable)
      .values({
        website_id: website[0].id,
        title: 'Test Page',
        slug: 'test-page'
      })
      .returning()
      .execute();

    const blockTemplate = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block',
        category: 'content',
        default_content: { text: 'default' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    const pageBlock = await db.insert(pageBlocksTable)
      .values({
        page_id: page[0].id,
        block_template_id: blockTemplate[0].id,
        content: { text: 'original content' },
        settings: { color: 'blue' },
        sort_order: 1
      })
      .returning()
      .execute();

    // Update only content
    const updateInput: UpdatePageBlockInput = {
      id: pageBlock[0].id,
      content: { text: 'updated content only' }
    };

    const result = await updatePageBlock(updateInput);

    expect(result.content).toEqual({ text: 'updated content only' });
    expect(result.settings).toEqual({ color: 'blue' }); // Should remain unchanged
    expect(result.sort_order).toEqual(1); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    // Create prerequisite data
    const website = await db.insert(websitesTable)
      .values({ name: 'Test Website' })
      .returning()
      .execute();

    const page = await db.insert(pagesTable)
      .values({
        website_id: website[0].id,
        title: 'Test Page',
        slug: 'test-page'
      })
      .returning()
      .execute();

    const blockTemplate = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block',
        category: 'content',
        default_content: { text: 'default' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    const pageBlock = await db.insert(pageBlocksTable)
      .values({
        page_id: page[0].id,
        block_template_id: blockTemplate[0].id,
        content: { text: 'original' },
        settings: { color: 'blue' },
        sort_order: 1
      })
      .returning()
      .execute();

    const updateInput: UpdatePageBlockInput = {
      id: pageBlock[0].id,
      content: { text: 'persisted content' },
      sort_order: 5
    };

    await updatePageBlock(updateInput);

    // Verify changes were saved to database
    const updatedBlocks = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.id, pageBlock[0].id))
      .execute();

    expect(updatedBlocks).toHaveLength(1);
    expect(updatedBlocks[0].content).toEqual({ text: 'persisted content' });
    expect(updatedBlocks[0].sort_order).toEqual(5);
    expect(updatedBlocks[0].updated_at > pageBlock[0].updated_at).toBe(true);
  });

  it('should throw error for non-existent page block', async () => {
    const updateInput: UpdatePageBlockInput = {
      id: 99999,
      content: { text: 'test' }
    };

    expect(updatePageBlock(updateInput)).rejects.toThrow(/not found/i);
  });
});
