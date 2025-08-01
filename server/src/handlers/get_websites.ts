
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { type Website } from '../schema';

export const getWebsites = async (): Promise<Website[]> => {
  try {
    const results = await db.select()
      .from(websitesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch websites:', error);
    throw error;
  }
};
