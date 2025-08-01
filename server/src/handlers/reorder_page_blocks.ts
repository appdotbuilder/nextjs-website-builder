
import { db } from '../db';
import { pageBlocksTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const reorderPageBlocks = async (blockIds: number[]): Promise<{ success: boolean }> => {
  try {
    // Update each block's sort_order based on its position in the array
    for (let i = 0; i < blockIds.length; i++) {
      const blockId = blockIds[i];
      await db
        .update(pageBlocksTable)
        .set({ 
          sort_order: i,
          updated_at: new Date()
        })
        .where(eq(pageBlocksTable.id, blockId))
        .execute();
    }

    return { success: true };
  } catch (error) {
    console.error('Block reordering failed:', error);
    throw error;
  }
};
