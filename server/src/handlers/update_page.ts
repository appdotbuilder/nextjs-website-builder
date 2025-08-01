
import { db } from '../db';
import { pagesTable } from '../db/schema';
import { type UpdatePageInput, type Page } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePage = async (input: UpdatePageInput): Promise<Page> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof pagesTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    if (input.meta_description !== undefined) {
      updateData.meta_description = input.meta_description;
    }
    if (input.seo_title !== undefined) {
      updateData.seo_title = input.seo_title;
    }
    if (input.seo_keywords !== undefined) {
      updateData.seo_keywords = input.seo_keywords;
    }
    if (input.is_homepage !== undefined) {
      updateData.is_homepage = input.is_homepage;
    }
    if (input.sort_order !== undefined) {
      updateData.sort_order = input.sort_order;
    }
    if (input.is_published !== undefined) {
      updateData.is_published = input.is_published;
    }

    // Update page record
    const result = await db.update(pagesTable)
      .set(updateData)
      .where(eq(pagesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Page with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Page update failed:', error);
    throw error;
  }
};
