
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, blockTemplatesTable, pageBlocksTable } from '../db/schema';
import { reorderPageBlocks } from '../handlers/reorder_page_blocks';
import { eq, asc } from 'drizzle-orm';

describe('reorderPageBlocks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reorder page blocks based on array position', async () => {
    // Create prerequisite data
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();
    const websiteId = websiteResult[0].id;

    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: websiteId,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    const templateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Template',
        category: 'content',
        description: 'Test template',
        default_content: {},
        settings_schema: {}
      })
      .returning()
      .execute();
    const templateId = templateResult[0].id;

    // Create three page blocks with initial order
    const block1Result = await db.insert(pageBlocksTable)
      .values({
        page_id: pageId,
        block_template_id: templateId,
        content: { text: 'Block 1' },
        settings: {},
        sort_order: 0
      })
      .returning()
      .execute();

    const block2Result = await db.insert(pageBlocksTable)
      .values({
        page_id: pageId,
        block_template_id: templateId,
        content: { text: 'Block 2' },
        settings: {},
        sort_order: 1
      })
      .returning()
      .execute();

    const block3Result = await db.insert(pageBlocksTable)
      .values({
        page_id: pageId,
        block_template_id: templateId,
        content: { text: 'Block 3' },
        settings: {},
        sort_order: 2
      })
      .returning()
      .execute();

    const block1Id = block1Result[0].id;
    const block2Id = block2Result[0].id;
    const block3Id = block3Result[0].id;

    // Reorder blocks: [block3, block1, block2]
    const result = await reorderPageBlocks([block3Id, block1Id, block2Id]);

    expect(result.success).toBe(true);

    // Verify new sort orders
    const reorderedBlocks = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, pageId))
      .orderBy(asc(pageBlocksTable.sort_order))
      .execute();

    expect(reorderedBlocks).toHaveLength(3);
    expect(reorderedBlocks[0].id).toBe(block3Id);
    expect(reorderedBlocks[0].sort_order).toBe(0);
    expect(reorderedBlocks[1].id).toBe(block1Id);
    expect(reorderedBlocks[1].sort_order).toBe(1);
    expect(reorderedBlocks[2].id).toBe(block2Id);
    expect(reorderedBlocks[2].sort_order).toBe(2);
  });

  it('should handle single block reordering', async () => {
    // Create prerequisite data
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();
    const websiteId = websiteResult[0].id;

    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: websiteId,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    const templateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Template',
        category: 'content',
        description: 'Test template',
        default_content: {},
        settings_schema: {}
      })
      .returning()
      .execute();
    const templateId = templateResult[0].id;

    // Create single page block
    const blockResult = await db.insert(pageBlocksTable)
      .values({
        page_id: pageId,
        block_template_id: templateId,
        content: { text: 'Single Block' },
        settings: {},
        sort_order: 5 // Start with non-zero order
      })
      .returning()
      .execute();

    const blockId = blockResult[0].id;

    // Reorder single block
    const result = await reorderPageBlocks([blockId]);

    expect(result.success).toBe(true);

    // Verify sort order was updated to 0
    const updatedBlock = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.id, blockId))
      .execute();

    expect(updatedBlock[0].sort_order).toBe(0);
  });

  it('should handle empty array', async () => {
    const result = await reorderPageBlocks([]);

    expect(result.success).toBe(true);
  });

  it('should update updated_at timestamp', async () => {
    // Create prerequisite data
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();
    const websiteId = websiteResult[0].id;

    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: websiteId,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();
    const pageId = pageResult[0].id;

    const templateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Template',
        category: 'content',
        description: 'Test template',
        default_content: {},
        settings_schema: {}
      })
      .returning()
      .execute();
    const templateId = templateResult[0].id;

    // Create page block
    const blockResult = await db.insert(pageBlocksTable)
      .values({
        page_id: pageId,
        block_template_id: templateId,
        content: { text: 'Test Block' },
        settings: {},
        sort_order: 0
      })
      .returning()
      .execute();

    const blockId = blockResult[0].id;
    const originalUpdatedAt = blockResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Reorder block
    await reorderPageBlocks([blockId]);

    // Verify updated_at was changed
    const updatedBlock = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.id, blockId))
      .execute();

    expect(updatedBlock[0].updated_at > originalUpdatedAt).toBe(true);
  });
});
