
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable } from '../db/schema';
import { type UpdatePageInput } from '../schema';
import { updatePage } from '../handlers/update_page';
import { eq } from 'drizzle-orm';

describe('updatePage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testWebsiteId: number;
  let testPageId: number;

  beforeEach(async () => {
    // Create test website
    const website = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'test.com'
      })
      .returning()
      .execute();
    testWebsiteId = website[0].id;

    // Create test page
    const page = await db.insert(pagesTable)
      .values({
        website_id: testWebsiteId,
        title: 'Original Title',
        slug: 'original-slug',
        meta_description: 'Original description',
        seo_title: 'Original SEO Title',
        seo_keywords: 'original, keywords',
        is_homepage: false,
        sort_order: 1,
        is_published: false
      })
      .returning()
      .execute();
    testPageId = page[0].id;
  });

  it('should update all page fields', async () => {
    const updateInput: UpdatePageInput = {
      id: testPageId,
      title: 'Updated Title',
      slug: 'updated-slug',
      meta_description: 'Updated description',
      seo_title: 'Updated SEO Title',
      seo_keywords: 'updated, keywords',
      is_homepage: true,
      sort_order: 2,
      is_published: true
    };

    const result = await updatePage(updateInput);

    expect(result.id).toEqual(testPageId);
    expect(result.website_id).toEqual(testWebsiteId);
    expect(result.title).toEqual('Updated Title');
    expect(result.slug).toEqual('updated-slug');
    expect(result.meta_description).toEqual('Updated description');
    expect(result.seo_title).toEqual('Updated SEO Title');
    expect(result.seo_keywords).toEqual('updated, keywords');
    expect(result.is_homepage).toEqual(true);
    expect(result.sort_order).toEqual(2);
    expect(result.is_published).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdatePageInput = {
      id: testPageId,
      title: 'Partially Updated Title',
      is_published: true
    };

    const result = await updatePage(updateInput);

    // Updated fields
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.is_published).toEqual(true);

    // Unchanged fields should retain original values
    expect(result.slug).toEqual('original-slug');
    expect(result.meta_description).toEqual('Original description');
    expect(result.seo_title).toEqual('Original SEO Title');
    expect(result.seo_keywords).toEqual('original, keywords');
    expect(result.is_homepage).toEqual(false);
    expect(result.sort_order).toEqual(1);
  });

  it('should save updated page to database', async () => {
    const updateInput: UpdatePageInput = {
      id: testPageId,
      title: 'Database Updated Title',
      is_homepage: true
    };

    await updatePage(updateInput);

    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, testPageId))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].title).toEqual('Database Updated Title');
    expect(pages[0].is_homepage).toEqual(true);
    expect(pages[0].slug).toEqual('original-slug'); // Unchanged
  });

  it('should handle null values correctly', async () => {
    const updateInput: UpdatePageInput = {
      id: testPageId,
      meta_description: null,
      seo_title: null,
      seo_keywords: null
    };

    const result = await updatePage(updateInput);

    expect(result.meta_description).toBeNull();
    expect(result.seo_title).toBeNull();
    expect(result.seo_keywords).toBeNull();
  });

  it('should throw error for non-existent page', async () => {
    const updateInput: UpdatePageInput = {
      id: 99999,
      title: 'Non-existent Page'
    };

    expect(updatePage(updateInput)).rejects.toThrow(/page with id 99999 not found/i);
  });

  it('should update the updated_at timestamp', async () => {
    // Get original timestamp
    const originalPage = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, testPageId))
      .execute();
    const originalTimestamp = originalPage[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdatePageInput = {
      id: testPageId,
      title: 'Timestamp Test'
    };

    const result = await updatePage(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });
});
