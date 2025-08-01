
import { db } from '../db';
import { websitesTable, pagesTable, pageBlocksTable, assetsTable } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

export const deleteWebsite = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First, get all page IDs for this website
    const websitePages = await db.select({ id: pagesTable.id })
      .from(pagesTable)
      .where(eq(pagesTable.website_id, id))
      .execute();

    const pageIds = websitePages.map(page => page.id);

    // Delete page blocks if there are any pages
    if (pageIds.length > 0) {
      await db.delete(pageBlocksTable)
        .where(inArray(pageBlocksTable.page_id, pageIds))
        .execute();
    }

    // Delete all pages belonging to the website
    await db.delete(pagesTable)
      .where(eq(pagesTable.website_id, id))
      .execute();

    // Delete all assets belonging to the website
    await db.delete(assetsTable)
      .where(eq(assetsTable.website_id, id))
      .execute();

    // Finally, delete the website itself
    await db.delete(websitesTable)
      .where(eq(websitesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Website deletion failed:', error);
    throw error;
  }
};
