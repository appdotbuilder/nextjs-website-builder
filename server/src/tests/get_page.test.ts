
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable } from '../db/schema';
import { type CreatePageInput } from '../schema';
import { getPage } from '../handlers/get_page';

describe('getPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve a page by id', async () => {
    // Create a website first (prerequisite)
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'test.com'
      })
      .returning()
      .execute();

    const website = websiteResult[0];

    // Create a page
    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: website.id,
        title: 'Test Page',
        slug: 'test-page',
        meta_description: 'A test page',
        seo_title: 'Test Page SEO',
        seo_keywords: 'test, page',
        is_homepage: false
      })
      .returning()
      .execute();

    const createdPage = pageResult[0];

    // Retrieve the page
    const result = await getPage(createdPage.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPage.id);
    expect(result!.website_id).toEqual(website.id);
    expect(result!.title).toEqual('Test Page');
    expect(result!.slug).toEqual('test-page');
    expect(result!.meta_description).toEqual('A test page');
    expect(result!.seo_title).toEqual('Test Page SEO');
    expect(result!.seo_keywords).toEqual('test, page');
    expect(result!.is_homepage).toEqual(false);
    expect(result!.sort_order).toEqual(0);
    expect(result!.is_published).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when page does not exist', async () => {
    const result = await getPage(999);
    expect(result).toBeNull();
  });

  it('should retrieve page with null optional fields', async () => {
    // Create a website first
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    const website = websiteResult[0];

    // Create a page with minimal required fields
    const pageResult = await db.insert(pagesTable)
      .values({
        website_id: website.id,
        title: 'Minimal Page',
        slug: 'minimal-page',
        meta_description: null,
        seo_title: null,
        seo_keywords: null
      })
      .returning()
      .execute();

    const createdPage = pageResult[0];

    // Retrieve the page
    const result = await getPage(createdPage.id);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Page');
    expect(result!.slug).toEqual('minimal-page');
    expect(result!.meta_description).toBeNull();
    expect(result!.seo_title).toBeNull();
    expect(result!.seo_keywords).toBeNull();
    expect(result!.is_homepage).toEqual(false);
    expect(result!.is_published).toEqual(false);
  });
});
