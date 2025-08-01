
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pagesTable, websitesTable } from '../db/schema';
import { type CreatePageInput } from '../schema';
import { createPage } from '../handlers/create_page';
import { eq } from 'drizzle-orm';

describe('createPage', () => {
  let websiteId: number;

  beforeEach(async () => {
    await createDB();

    // Create a test website first
    const websites = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'test.com'
      })
      .returning()
      .execute();

    websiteId = websites[0].id;
  });

  afterEach(resetDB);

  it('should create a page with all required fields', async () => {
    const testInput: CreatePageInput = {
      website_id: websiteId,
      title: 'Test Page',
      slug: 'test-page',
      meta_description: 'A test page description',
      seo_title: 'Test Page SEO Title',
      seo_keywords: 'test, page, keywords',
      is_homepage: false
    };

    const result = await createPage(testInput);

    expect(result.id).toBeDefined();
    expect(result.website_id).toEqual(websiteId);
    expect(result.title).toEqual('Test Page');
    expect(result.slug).toEqual('test-page');
    expect(result.meta_description).toEqual('A test page description');
    expect(result.seo_title).toEqual('Test Page SEO Title');
    expect(result.seo_keywords).toEqual('test, page, keywords');
    expect(result.is_homepage).toEqual(false);
    expect(result.sort_order).toEqual(0);
    expect(result.is_published).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save page to database', async () => {
    const testInput: CreatePageInput = {
      website_id: websiteId,
      title: 'Database Test Page',
      slug: 'db-test-page',
      meta_description: null,
      seo_title: null,
      seo_keywords: null,
      is_homepage: true
    };

    const result = await createPage(testInput);

    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, result.id))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].title).toEqual('Database Test Page');
    expect(pages[0].slug).toEqual('db-test-page');
    expect(pages[0].meta_description).toBeNull();
    expect(pages[0].is_homepage).toEqual(true);
    expect(pages[0].created_at).toBeInstanceOf(Date);
  });

  it('should set correct sort order for multiple pages', async () => {
    // Create first page
    const firstPageInput: CreatePageInput = {
      website_id: websiteId,
      title: 'First Page',
      slug: 'first-page',
      meta_description: null,
      seo_title: null,
      seo_keywords: null
    };

    const firstPage = await createPage(firstPageInput);
    expect(firstPage.sort_order).toEqual(0);

    // Create second page
    const secondPageInput: CreatePageInput = {
      website_id: websiteId,
      title: 'Second Page',
      slug: 'second-page',
      meta_description: null,
      seo_title: null,
      seo_keywords: null
    };

    const secondPage = await createPage(secondPageInput);
    expect(secondPage.sort_order).toEqual(1);
  });

  it('should unset existing homepage when creating new homepage', async () => {
    // Create first page as homepage
    const firstPageInput: CreatePageInput = {
      website_id: websiteId,
      title: 'First Homepage',
      slug: 'first-home',
      meta_description: null,
      seo_title: null,
      seo_keywords: null,
      is_homepage: true
    };

    const firstPage = await createPage(firstPageInput);
    expect(firstPage.is_homepage).toEqual(true);

    // Create second page as homepage
    const secondPageInput: CreatePageInput = {
      website_id: websiteId,
      title: 'Second Homepage',
      slug: 'second-home',
      meta_description: null,
      seo_title: null,
      seo_keywords: null,
      is_homepage: true
    };

    const secondPage = await createPage(secondPageInput);
    expect(secondPage.is_homepage).toEqual(true);

    // Verify first page is no longer homepage
    const updatedFirstPage = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, firstPage.id))
      .execute();

    expect(updatedFirstPage[0].is_homepage).toEqual(false);
  });

  it('should throw error for non-existent website', async () => {
    const testInput: CreatePageInput = {
      website_id: 99999, // Non-existent website ID
      title: 'Test Page',
      slug: 'test-page',
      meta_description: null,
      seo_title: null,
      seo_keywords: null
    };

    expect(createPage(testInput)).rejects.toThrow(/website with id 99999 does not exist/i);
  });

  it('should handle optional fields correctly', async () => {
    const testInput: CreatePageInput = {
      website_id: websiteId,
      title: 'Minimal Page',
      slug: 'minimal-page',
      meta_description: null,
      seo_title: null,
      seo_keywords: null
    };

    const result = await createPage(testInput);

    expect(result.meta_description).toBeNull();
    expect(result.seo_title).toBeNull();
    expect(result.seo_keywords).toBeNull();
    expect(result.is_homepage).toEqual(false); // Should default to false
  });
});
