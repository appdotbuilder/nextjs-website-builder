
import { db } from '../db';
import { pagesTable } from '../db/schema';
import { type Page } from '../schema';
import { eq } from 'drizzle-orm';

export const getPages = async (websiteId: number): Promise<Page[]> => {
  try {
    const results = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.website_id, websiteId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch pages:', error);
    throw error;
  }
};
