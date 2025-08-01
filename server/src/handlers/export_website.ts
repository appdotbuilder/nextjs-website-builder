
import { db } from '../db';
import { websitesTable, pagesTable, pageBlocksTable, assetsTable } from '../db/schema';
import { type WebsiteExport } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const exportWebsite = async (websiteId: number): Promise<WebsiteExport> => {
  try {
    // First, verify the website exists
    const websites = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, websiteId))
      .execute();

    if (websites.length === 0) {
      throw new Error(`Website with id ${websiteId} not found`);
    }

    const website = websites[0];

    // Get all pages for this website
    const pages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.website_id, websiteId))
      .execute();

    // Get all page blocks for all pages of this website
    let blocks: any[] = [];
    if (pages.length > 0) {
      const pageIds = pages.map(page => page.id);
      
      // Use inArray to query blocks for multiple page IDs
      blocks = await db.select()
        .from(pageBlocksTable)
        .where(inArray(pageBlocksTable.page_id, pageIds))
        .execute();
    }

    // Get all assets for this website
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.website_id, websiteId))
      .execute();

    return {
      website,
      pages,
      blocks,
      assets
    };
  } catch (error) {
    console.error('Website export failed:', error);
    throw error;
  }
};
