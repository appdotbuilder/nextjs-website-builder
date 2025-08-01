
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { type CreateWebsiteInput, type Website } from '../schema';

export const createWebsite = async (input: CreateWebsiteInput): Promise<Website> => {
  try {
    // Insert website record
    const result = await db.insert(websitesTable)
      .values({
        name: input.name,
        domain: input.domain
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Website creation failed:', error);
    throw error;
  }
};
