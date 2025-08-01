
import { db } from '../db';
import { pageBlocksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePageBlock = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the page block by ID
    const result = await db.delete(pageBlocksTable)
      .where(eq(pageBlocksTable.id, id))
      .returning()
      .execute();

    // Return success based on whether a record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Page block deletion failed:', error);
    throw error;
  }
};
