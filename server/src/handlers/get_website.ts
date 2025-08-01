
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { type Website } from '../schema';
import { eq } from 'drizzle-orm';

export const getWebsite = async (id: number): Promise<Website | null> => {
  try {
    const results = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Website fetch failed:', error);
    throw error;
  }
};
