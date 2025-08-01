
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, pageBlocksTable, assetsTable, blockTemplatesTable } from '../db/schema';
import { deleteWebsite } from '../handlers/delete_website';
import { eq } from 'drizzle-orm';

describe('deleteWebsite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a website with no related data', async () => {
    // Create a website
    const website = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'test.com'
      })
      .returning()
      .execute();

    const websiteId = website[0].id;

    // Delete the website
    const result = await deleteWebsite(websiteId);

    expect(result.success).toBe(true);

    // Verify website is deleted
    const websites = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, websiteId))
      .execute();

    expect(websites).toHaveLength(0);
  });

  it('should delete website and all related data in correct order', async () => {
    // Create a website
    const website = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'test.com'
      })
      .returning()
      .execute();

    const websiteId = website[0].id;

    // Create a page for the website
    const page = await db.insert(pagesTable)
      .values({
        website_id: websiteId,
        title: 'Test Page',
        slug: 'test-page'
      })
      .returning()
      .execute();

    const pageId = page[0].id;

    // Create a block template
    const blockTemplate = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block',
        category: 'text',
        default_content: { text: 'Default text' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    const blockTemplateId = blockTemplate[0].id;

    // Create a page block
    await db.insert(pageBlocksTable)
      .values({
        page_id: pageId,
        block_template_id: blockTemplateId,
        content: { text: 'Custom text' },
        settings: {}
      })
      .execute();

    // Create an asset for the website
    await db.insert(assetsTable)
      .values({
        website_id: websiteId,
        filename: 'test.jpg',
        original_name: 'test-image.jpg',
        mime_type: 'image/jpeg',
        file_size: 1024,
        url: '/uploads/test.jpg'
      })
      .execute();

    // Delete the website
    const result = await deleteWebsite(websiteId);

    expect(result.success).toBe(true);

    // Verify all related data is deleted
    const websites = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, websiteId))
      .execute();

    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.website_id, websiteId))
      .execute();

    const pageBlocks = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, pageId))
      .execute();

    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.website_id, websiteId))
      .execute();

    expect(websites).toHaveLength(0);
    expect(pages).toHaveLength(0);
    expect(pageBlocks).toHaveLength(0);
    expect(assets).toHaveLength(0);

    // Verify block template is NOT deleted (it's not owned by the website)
    const blockTemplates = await db.select()
      .from(blockTemplatesTable)
      .where(eq(blockTemplatesTable.id, blockTemplateId))
      .execute();

    expect(blockTemplates).toHaveLength(1);
  });

  it('should handle deleting non-existent website gracefully', async () => {
    // Try to delete a non-existent website
    const result = await deleteWebsite(999999);

    expect(result.success).toBe(true);
  });

  it('should delete website with multiple pages and blocks', async () => {
    // Create a website
    const website = await db.insert(websitesTable)
      .values({
        name: 'Multi-page Website',
        domain: 'multi.com'
      })
      .returning()
      .execute();

    const websiteId = website[0].id;

    // Create multiple pages
    const pages = await db.insert(pagesTable)
      .values([
        {
          website_id: websiteId,
          title: 'Page 1',
          slug: 'page-1'
        },
        {
          website_id: websiteId,
          title: 'Page 2',
          slug: 'page-2'
        }
      ])
      .returning()
      .execute();

    // Create a block template
    const blockTemplate = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block',
        category: 'text',
        default_content: { text: 'Default' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();

    const blockTemplateId = blockTemplate[0].id;

    // Create blocks for each page
    await db.insert(pageBlocksTable)
      .values([
        {
          page_id: pages[0].id,
          block_template_id: blockTemplateId,
          content: { text: 'Page 1 block' },
          settings: {}
        },
        {
          page_id: pages[1].id,
          block_template_id: blockTemplateId,
          content: { text: 'Page 2 block' },
          settings: {}
        }
      ])
      .execute();

    // Delete the website
    const result = await deleteWebsite(websiteId);

    expect(result.success).toBe(true);

    // Verify everything is cleaned up
    const remainingWebsites = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, websiteId))
      .execute();

    const remainingPages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.website_id, websiteId))
      .execute();

    const remainingBlocks = await db.select()
      .from(pageBlocksTable)
      .execute();

    expect(remainingWebsites).toHaveLength(0);
    expect(remainingPages).toHaveLength(0);
    expect(remainingBlocks).toHaveLength(0);
  });
});
