
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { type UpdateWebsiteInput, type Website } from '../schema';
import { eq } from 'drizzle-orm';

export const updateWebsite = async (input: UpdateWebsiteInput): Promise<Website> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof websitesTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.domain !== undefined) {
      updateData.domain = input.domain;
    }
    
    if (input.is_published !== undefined) {
      updateData.is_published = input.is_published;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the website record
    const result = await db.update(websitesTable)
      .set(updateData)
      .where(eq(websitesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Website with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Website update failed:', error);
    throw error;
  }
};
