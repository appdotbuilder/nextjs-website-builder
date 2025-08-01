
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, blockTemplatesTable, pageBlocksTable } from '../db/schema';
import { type CreatePageBlockInput } from '../schema';
import { createPageBlock } from '../handlers/create_page_block';
import { eq } from 'drizzle-orm';

describe('createPageBlock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let websiteId: number;
  let pageId: number;
  let blockTemplateId: number;

  beforeEach(async () => {
    // Create prerequisite website
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'test.com'
      })
      .returning()
      .execute();
    websiteId = websiteResult[0].id;

    // Create prerequisite page
    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: websiteId,
        title: 'Test Page',
        slug: 'test-page'
      })
      .returning()
      .execute();
    pageId = pageResult[0].id;

    // Create prerequisite block template
    const blockTemplateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block Template',
        category: 'content',
        description: 'A test block template',
        default_content: { text: 'Default text' },
        settings_schema: { type: 'object', properties: { fontSize: { type: 'number' } } }
      })
      .returning()
      .execute();
    blockTemplateId = blockTemplateResult[0].id;
  });

  it('should create a page block with default values', async () => {
    const testInput: CreatePageBlockInput = {
      page_id: pageId,
      block_template_id: blockTemplateId
    };

    const result = await createPageBlock(testInput);

    expect(result.page_id).toEqual(pageId);
    expect(result.block_template_id).toEqual(blockTemplateId);
    expect(result.content).toEqual({});
    expect(result.settings).toEqual({});
    expect(result.sort_order).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a page block with custom values', async () => {
    const customContent = { title: 'Custom Title', body: 'Custom body text' };
    const customSettings = { fontSize: 16, color: 'blue' };

    const testInput: CreatePageBlockInput = {
      page_id: pageId,
      block_template_id: blockTemplateId,
      content: customContent,
      settings: customSettings,
      sort_order: 5
    };

    const result = await createPageBlock(testInput);

    expect(result.page_id).toEqual(pageId);
    expect(result.block_template_id).toEqual(blockTemplateId);
    expect(result.content).toEqual(customContent);
    expect(result.settings).toEqual(customSettings);
    expect(result.sort_order).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save page block to database', async () => {
    const testInput: CreatePageBlockInput = {
      page_id: pageId,
      block_template_id: blockTemplateId,
      content: { title: 'Test Title' },
      settings: { fontSize: 14 }
    };

    const result = await createPageBlock(testInput);

    const pageBlocks = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.id, result.id))
      .execute();

    expect(pageBlocks).toHaveLength(1);
    expect(pageBlocks[0].page_id).toEqual(pageId);
    expect(pageBlocks[0].block_template_id).toEqual(blockTemplateId);
    expect(pageBlocks[0].content).toEqual({ title: 'Test Title' });
    expect(pageBlocks[0].settings).toEqual({ fontSize: 14 });
    expect(pageBlocks[0].created_at).toBeInstanceOf(Date);
    expect(pageBlocks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should auto-increment sort_order when not provided', async () => {
    // Create first page block
    const firstInput: CreatePageBlockInput = {
      page_id: pageId,
      block_template_id: blockTemplateId
    };
    const firstResult = await createPageBlock(firstInput);
    expect(firstResult.sort_order).toEqual(0);

    // Create second page block without sort_order
    const secondInput: CreatePageBlockInput = {
      page_id: pageId,
      block_template_id: blockTemplateId
    };
    const secondResult = await createPageBlock(secondInput);
    expect(secondResult.sort_order).toEqual(1);

    // Create third page block without sort_order
    const thirdInput: CreatePageBlockInput = {
      page_id: pageId,
      block_template_id: blockTemplateId
    };
    const thirdResult = await createPageBlock(thirdInput);
    expect(thirdResult.sort_order).toEqual(2);
  });

  it('should throw error when page does not exist', async () => {
    const testInput: CreatePageBlockInput = {
      page_id: 99999,
      block_template_id: blockTemplateId
    };

    expect(createPageBlock(testInput)).rejects.toThrow(/page with id 99999 does not exist/i);
  });

  it('should throw error when block template does not exist', async () => {
    const testInput: CreatePageBlockInput = {
      page_id: pageId,
      block_template_id: 99999
    };

    expect(createPageBlock(testInput)).rejects.toThrow(/block template with id 99999 does not exist/i);
  });
});
