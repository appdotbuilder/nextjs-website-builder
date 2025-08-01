
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export const getAssets = async (websiteId: number): Promise<Asset[]> => {
  try {
    const results = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.website_id, websiteId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get assets failed:', error);
    throw error;
  }
};
