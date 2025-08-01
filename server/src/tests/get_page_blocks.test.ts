
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, blockTemplatesTable, pageBlocksTable } from '../db/schema';
import { getPageBlocks } from '../handlers/get_page_blocks';

describe('getPageBlocks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when page has no blocks', async () => {
    // Create a website first
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    // Create a page
    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: websiteResult[0].id,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();

    const result = await getPageBlocks(pageResult[0].id);

    expect(result).toEqual([]);
  });

  it('should return page blocks ordered by sort_order', async () => {
    // Create prerequisite data
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: websiteResult[0].id,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();

    const blockTemplateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block Template',
        category: 'content',
        description: 'A test block template',
        default_content: { text: 'Default text' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    // Create blocks with different sort orders
    await db.insert(pageBlocksTable)
      .values([
        {
          page_id: pageResult[0].id,
          block_template_id: blockTemplateResult[0].id,
          content: { text: 'Block 2' },
          settings: {},
          sort_order: 2
        },
        {
          page_id: pageResult[0].id,
          block_template_id: blockTemplateResult[0].id,
          content: { text: 'Block 1' },
          settings: {},
          sort_order: 1
        },
        {
          page_id: pageResult[0].id,
          block_template_id: blockTemplateResult[0].id,
          content: { text: 'Block 3' },
          settings: {},
          sort_order: 3
        }
      ])
      .execute();

    const result = await getPageBlocks(pageResult[0].id);

    expect(result).toHaveLength(3);
    expect(result[0].sort_order).toEqual(1);
    expect(result[1].sort_order).toEqual(2);
    expect(result[2].sort_order).toEqual(3);
    expect(result[0].content).toEqual({ text: 'Block 1' });
    expect(result[1].content).toEqual({ text: 'Block 2' });
    expect(result[2].content).toEqual({ text: 'Block 3' });
  });

  it('should only return blocks for the specified page', async () => {
    // Create prerequisite data
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    // Create two pages
    const pagesResult = await db.insert(pagesTable)
      .values([
        {
          website_id: websiteResult[0].id,
          title: 'Page 1',
          slug: 'page-1',
          meta_description: null,
          seo_title: null,
          seo_keywords: null
        },
        {
          website_id: websiteResult[0].id,
          title: 'Page 2',
          slug: 'page-2',
          meta_description: null,
          seo_title: null,
          seo_keywords: null
        }
      ])
      .returning()
      .execute();

    const blockTemplateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block Template',
        category: 'content',
        description: 'A test block template',
        default_content: { text: 'Default text' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    // Create blocks for both pages
    await db.insert(pageBlocksTable)
      .values([
        {
          page_id: pagesResult[0].id,
          block_template_id: blockTemplateResult[0].id,
          content: { text: 'Page 1 Block' },
          settings: {},
          sort_order: 1
        },
        {
          page_id: pagesResult[1].id,
          block_template_id: blockTemplateResult[0].id,
          content: { text: 'Page 2 Block' },
          settings: {},
          sort_order: 1
        }
      ])
      .execute();

    const result = await getPageBlocks(pagesResult[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].page_id).toEqual(pagesResult[0].id);
    expect(result[0].content).toEqual({ text: 'Page 1 Block' });
  });

  it('should return blocks with all required fields', async () => {
    // Create prerequisite data
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: websiteResult[0].id,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();

    const blockTemplateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block Template',
        category: 'content',
        description: 'A test block template',
        default_content: { text: 'Default text' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    await db.insert(pageBlocksTable)
      .values({
        page_id: pageResult[0].id,
        block_template_id: blockTemplateResult[0].id,
        content: { text: 'Test content', image: 'test.jpg' },
        settings: { width: '100%', margin: '10px' },
        sort_order: 1
      })
      .execute();

    const result = await getPageBlocks(pageResult[0].id);

    expect(result).toHaveLength(1);
    const block = result[0];
    expect(block.id).toBeDefined();
    expect(block.page_id).toEqual(pageResult[0].id);
    expect(block.block_template_id).toEqual(blockTemplateResult[0].id);
    expect(block.content).toEqual({ text: 'Test content', image: 'test.jpg' });
    expect(block.settings).toEqual({ width: '100%', margin: '10px' });
    expect(block.sort_order).toEqual(1);
    expect(block.created_at).toBeInstanceOf(Date);
    expect(block.updated_at).toBeInstanceOf(Date);
  });
});
