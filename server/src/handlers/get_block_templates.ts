
import { db } from '../db';
import { blockTemplatesTable } from '../db/schema';
import { type BlockTemplate } from '../schema';

export const getBlockTemplates = async (): Promise<BlockTemplate[]> => {
  try {
    const results = await db.select()
      .from(blockTemplatesTable)
      .execute();

    return results.map(result => ({
      ...result,
      default_content: result.default_content as Record<string, any>,
      settings_schema: result.settings_schema as Record<string, any>
    }));
  } catch (error) {
    console.error('Failed to fetch block templates:', error);
    throw error;
  }
};
