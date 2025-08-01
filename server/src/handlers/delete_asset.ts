
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteAsset = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the asset record from database
    const result = await db.delete(assetsTable)
      .where(eq(assetsTable.id, id))
      .execute();

    // Check if any rows were affected (asset existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Asset deletion failed:', error);
    throw error;
  }
};
