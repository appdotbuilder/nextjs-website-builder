
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, pagesTable, pageBlocksTable, assetsTable, blockTemplatesTable } from '../db/schema';
import { exportWebsite } from '../handlers/export_website';

describe('exportWebsite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should export a website with all related data', async () => {
    // Create a website
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'example.com',
        is_published: true
      })
      .returning()
      .execute();
    
    const website = websiteResult[0];

    // Create block template first (required for page blocks)
    const blockTemplateResult = await db.insert(blockTemplatesTable)
      .values({
        name: 'Test Block',
        category: 'content',
        description: 'A test block template',
        default_content: { text: 'Default content' },
        settings_schema: { type: 'object' }
      })
      .returning()
      .execute();
    
    const blockTemplate = blockTemplateResult[0];

    // Create pages
    const pageResults = await db.insert(pagesTable)
      .values([
        {
          website_id: website.id,
          title: 'Home Page',
          slug: 'home',
          meta_description: 'Home page description',
          is_homepage: true,
          sort_order: 1,
          is_published: true
        },
        {
          website_id: website.id,
          title: 'About Page',
          slug: 'about',
          meta_description: 'About page description',
          is_homepage: false,
          sort_order: 2,
          is_published: false
        }
      ])
      .returning()
      .execute();

    const [homePage, aboutPage] = pageResults;

    // Create page blocks
    await db.insert(pageBlocksTable)
      .values([
        {
          page_id: homePage.id,
          block_template_id: blockTemplate.id,
          content: { text: 'Welcome to our homepage' },
          settings: { color: 'blue' },
          sort_order: 1
        },
        {
          page_id: aboutPage.id,
          block_template_id: blockTemplate.id,
          content: { text: 'About us content' },
          settings: { color: 'red' },
          sort_order: 1
        }
      ])
      .execute();

    // Create assets
    await db.insert(assetsTable)
      .values([
        {
          website_id: website.id,
          filename: 'logo.png',
          original_name: 'company-logo.png',
          mime_type: 'image/png',
          file_size: 1024,
          url: '/uploads/logo.png'
        },
        {
          website_id: website.id,
          filename: 'hero.jpg',
          original_name: 'hero-image.jpg',
          mime_type: 'image/jpeg',
          file_size: 2048,
          url: '/uploads/hero.jpg'
        }
      ])
      .execute();

    // Export the website
    const result = await exportWebsite(website.id);

    // Validate website data
    expect(result.website.id).toEqual(website.id);
    expect(result.website.name).toEqual('Test Website');
    expect(result.website.domain).toEqual('example.com');
    expect(result.website.is_published).toEqual(true);
    expect(result.website.created_at).toBeInstanceOf(Date);
    expect(result.website.updated_at).toBeInstanceOf(Date);

    // Validate pages data
    expect(result.pages).toHaveLength(2);
    
    const homePageExport = result.pages.find(p => p.slug === 'home');
    expect(homePageExport).toBeDefined();
    expect(homePageExport!.title).toEqual('Home Page');
    expect(homePageExport!.is_homepage).toEqual(true);
    expect(homePageExport!.sort_order).toEqual(1);
    
    const aboutPageExport = result.pages.find(p => p.slug === 'about');
    expect(aboutPageExport).toBeDefined();
    expect(aboutPageExport!.title).toEqual('About Page');
    expect(aboutPageExport!.is_homepage).toEqual(false);
    expect(aboutPageExport!.sort_order).toEqual(2);

    // Validate blocks data
    expect(result.blocks).toHaveLength(2);
    
    const homeBlock = result.blocks.find(b => b.page_id === homePage.id);
    expect(homeBlock).toBeDefined();
    expect(homeBlock!.content).toEqual({ text: 'Welcome to our homepage' });
    expect(homeBlock!.settings).toEqual({ color: 'blue' });
    expect(homeBlock!.sort_order).toEqual(1);
    
    const aboutBlock = result.blocks.find(b => b.page_id === aboutPage.id);
    expect(aboutBlock).toBeDefined();
    expect(aboutBlock!.content).toEqual({ text: 'About us content' });
    expect(aboutBlock!.settings).toEqual({ color: 'red' });

    // Validate assets data
    expect(result.assets).toHaveLength(2);
    
    const logoAsset = result.assets.find(a => a.filename === 'logo.png');
    expect(logoAsset).toBeDefined();
    expect(logoAsset!.original_name).toEqual('company-logo.png');
    expect(logoAsset!.mime_type).toEqual('image/png');
    expect(logoAsset!.file_size).toEqual(1024);
    expect(logoAsset!.url).toEqual('/uploads/logo.png');
    
    const heroAsset = result.assets.find(a => a.filename === 'hero.jpg');
    expect(heroAsset).toBeDefined();
    expect(heroAsset!.original_name).toEqual('hero-image.jpg');
    expect(heroAsset!.mime_type).toEqual('image/jpeg');
    expect(heroAsset!.file_size).toEqual(2048);
  });

  it('should export website with empty collections when no related data exists', async () => {
    // Create a minimal website
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Empty Website',
        domain: null,
        is_published: false
      })
      .returning()
      .execute();
    
    const website = websiteResult[0];

    // Export the website
    const result = await exportWebsite(website.id);

    // Validate website data
    expect(result.website.id).toEqual(website.id);
    expect(result.website.name).toEqual('Empty Website');
    expect(result.website.domain).toBeNull();
    expect(result.website.is_published).toEqual(false);

    // Validate empty collections
    expect(result.pages).toHaveLength(0);
    expect(result.blocks).toHaveLength(0);
    expect(result.assets).toHaveLength(0);
  });

  it('should throw error when website does not exist', async () => {
    const nonExistentId = 999;
    
    await expect(exportWebsite(nonExistentId)).rejects.toThrow(/Website with id 999 not found/i);
  });

  it('should export website with pages but no blocks or assets', async () => {
    // Create website
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Pages Only Website',
        domain: 'pages-only.com',
        is_published: true
      })
      .returning()
      .execute();
    
    const website = websiteResult[0];

    // Create pages without blocks
    await db.insert(pagesTable)
      .values({
        website_id: website.id,
        title: 'Solo Page',
        slug: 'solo',
        meta_description: 'A page without blocks',
        is_homepage: true,
        sort_order: 1,
        is_published: true
      })
      .execute();

    // Export the website
    const result = await exportWebsite(website.id);

    // Validate website and pages
    expect(result.website.name).toEqual('Pages Only Website');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].title).toEqual('Solo Page');
    
    // Validate empty collections
    expect(result.blocks).toHaveLength(0);
    expect(result.assets).toHaveLength(0);
  });
});
