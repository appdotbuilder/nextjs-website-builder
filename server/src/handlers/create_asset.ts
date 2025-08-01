
import { db } from '../db';
import { assetsTable, websitesTable } from '../db/schema';
import { type CreateAssetInput, type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export const createAsset = async (input: CreateAssetInput): Promise<Asset> => {
  try {
    // Verify that the website exists first
    const existingWebsite = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, input.website_id))
      .execute();

    if (existingWebsite.length === 0) {
      throw new Error(`Website with id ${input.website_id} not found`);
    }

    // Insert asset record
    const result = await db.insert(assetsTable)
      .values({
        website_id: input.website_id,
        filename: input.filename,
        original_name: input.original_name,
        mime_type: input.mime_type,
        file_size: input.file_size,
        url: input.url
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Asset creation failed:', error);
    throw error;
  }
};
