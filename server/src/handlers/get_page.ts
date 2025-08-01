
import { db } from '../db';
import { pagesTable } from '../db/schema';
import { type Page } from '../schema';
import { eq } from 'drizzle-orm';

export const getPage = async (id: number): Promise<Page | null> => {
  try {
    const result = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Page retrieval failed:', error);
    throw error;
  }
};
