
import { db } from '../db';
import { pageBlocksTable } from '../db/schema';
import { type PageBlock } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getPageBlocks = async (pageId: number): Promise<PageBlock[]> => {
  try {
    const results = await db.select()
      .from(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, pageId))
      .orderBy(asc(pageBlocksTable.sort_order))
      .execute();

    // Transform the results to match the expected PageBlock type
    return results.map(result => ({
      ...result,
      content: result.content as Record<string, any>,
      settings: result.settings as Record<string, any>
    }));
  } catch (error) {
    console.error('Failed to get page blocks:', error);
    throw error;
  }
};
