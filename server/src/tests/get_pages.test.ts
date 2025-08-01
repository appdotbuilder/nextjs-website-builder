
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable } from '../db/schema';
import { getPages } from '../handlers/get_pages';

describe('getPages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no pages exist', async () => {
    // Create a website first
    const websites = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'example.com'
      })
      .returning()
      .execute();

    const websiteId = websites[0].id;
    const result = await getPages(websiteId);

    expect(result).toEqual([]);
  });

  it('should return all pages for a specific website', async () => {
    // Create a website
    const websites = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'example.com'
      })
      .returning()
      .execute();

    const websiteId = websites[0].id;

    // Create pages for this website
    await db.insert(pagesTable)
      .values([
        {
          website_id: websiteId,
          title: 'Home Page',
          slug: 'home',
          meta_description: 'Home page description',
          is_homepage: true,
          sort_order: 1
        },
        {
          website_id: websiteId,
          title: 'About Page',
          slug: 'about',
          meta_description: 'About page description',
          is_homepage: false,
          sort_order: 2
        }
      ])
      .execute();

    const result = await getPages(websiteId);

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Home Page');
    expect(result[0].slug).toEqual('home');
    expect(result[0].website_id).toEqual(websiteId);
    expect(result[0].is_homepage).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].title).toEqual('About Page');
    expect(result[1].slug).toEqual('about');
    expect(result[1].website_id).toEqual(websiteId);
    expect(result[1].is_homepage).toBe(false);
  });

  it('should only return pages for the specified website', async () => {
    // Create two websites
    const websites = await db.insert(websitesTable)
      .values([
        {
          name: 'Website 1',
          domain: 'site1.com'
        },
        {
          name: 'Website 2',
          domain: 'site2.com'
        }
      ])
      .returning()
      .execute();

    const website1Id = websites[0].id;
    const website2Id = websites[1].id;

    // Create pages for both websites
    await db.insert(pagesTable)
      .values([
        {
          website_id: website1Id,
          title: 'Site 1 Home',
          slug: 'home',
          meta_description: 'Site 1 home'
        },
        {
          website_id: website2Id,
          title: 'Site 2 Home',
          slug: 'home',
          meta_description: 'Site 2 home'
        },
        {
          website_id: website1Id,
          title: 'Site 1 About',
          slug: 'about',
          meta_description: 'Site 1 about'
        }
      ])
      .execute();

    // Should only return pages for website 1
    const result = await getPages(website1Id);

    expect(result).toHaveLength(2);
    result.forEach(page => {
      expect(page.website_id).toEqual(website1Id);
    });

    const titles = result.map(page => page.title);
    expect(titles).toContain('Site 1 Home');
    expect(titles).toContain('Site 1 About');
    expect(titles).not.toContain('Site 2 Home');
  });

  it('should handle non-existent website ID', async () => {
    const result = await getPages(999);
    expect(result).toEqual([]);
  });
});
