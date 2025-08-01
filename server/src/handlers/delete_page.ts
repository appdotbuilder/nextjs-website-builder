
import { db } from '../db';
import { pagesTable, pageBlocksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePage = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First delete all page blocks associated with this page
    await db.delete(pageBlocksTable)
      .where(eq(pageBlocksTable.page_id, id))
      .execute();

    // Then delete the page itself
    const result = await db.delete(pagesTable)
      .where(eq(pagesTable.id, id))
      .returning()
      .execute();

    // Return success based on whether a page was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Page deletion failed:', error);
    throw error;
  }
};
