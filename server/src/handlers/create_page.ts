
import { db } from '../db';
import { pagesTable, websitesTable } from '../db/schema';
import { type CreatePageInput, type Page } from '../schema';
import { eq } from 'drizzle-orm';

export const createPage = async (input: CreatePageInput): Promise<Page> => {
  try {
    // Verify the website exists to prevent foreign key constraint violation
    const websites = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, input.website_id))
      .execute();

    if (websites.length === 0) {
      throw new Error(`Website with id ${input.website_id} does not exist`);
    }

    // If this page is being set as homepage, unset any existing homepage for this website
    if (input.is_homepage) {
      await db.update(pagesTable)
        .set({ is_homepage: false })
        .where(eq(pagesTable.website_id, input.website_id))
        .execute();
    }

    // Get the next sort order for this website
    const existingPages = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.website_id, input.website_id))
      .execute();

    const nextSortOrder = existingPages.length;

    // Insert the new page
    const result = await db.insert(pagesTable)
      .values({
        website_id: input.website_id,
        title: input.title,
        slug: input.slug,
        meta_description: input.meta_description,
        seo_title: input.seo_title,
        seo_keywords: input.seo_keywords,
        is_homepage: input.is_homepage || false,
        sort_order: nextSortOrder,
        is_published: false
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Page creation failed:', error);
    throw error;
  }
};
