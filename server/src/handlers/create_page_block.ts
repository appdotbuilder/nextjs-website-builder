
import { db } from '../db';
import { pageBlocksTable, pagesTable, blockTemplatesTable } from '../db/schema';
import { type CreatePageBlockInput, type PageBlock } from '../schema';
import { eq, max } from 'drizzle-orm';

export const createPageBlock = async (input: CreatePageBlockInput): Promise<PageBlock> => {
  try {
    // Verify that the page exists
    const existingPage = await db.select()
      .from(pagesTable)
      .where(eq(pagesTable.id, input.page_id))
      .execute();

    if (existingPage.length === 0) {
      throw new Error(`Page with id ${input.page_id} does not exist`);
    }

    // Verify that the block template exists
    const existingBlockTemplate = await db.select()
      .from(blockTemplatesTable)
      .where(eq(blockTemplatesTable.id, input.block_template_id))
      .execute();

    if (existingBlockTemplate.length === 0) {
      throw new Error(`Block template with id ${input.block_template_id} does not exist`);
    }

    // Get the sort order - if not provided, find the next available sort_order
    let sortOrder = input.sort_order;
    if (sortOrder === undefined) {
      // Find the highest sort_order for this page and increment by 1
      const maxSortOrderResult = await db.select({ maxOrder: max(pageBlocksTable.sort_order) })
        .from(pageBlocksTable)
        .where(eq(pageBlocksTable.page_id, input.page_id))
        .execute();
      
      const currentMax = maxSortOrderResult[0]?.maxOrder;
      sortOrder = currentMax !== null ? currentMax + 1 : 0;
    }

    // Insert page block record
    const result = await db.insert(pageBlocksTable)
      .values({
        page_id: input.page_id,
        block_template_id: input.block_template_id,
        content: input.content || {},
        settings: input.settings || {},
        sort_order: sortOrder
      })
      .returning()
      .execute();

    // Type assert the result to match our schema expectations
    const pageBlock = result[0];
    return {
      ...pageBlock,
      content: pageBlock.content as Record<string, any>,
      settings: pageBlock.settings as Record<string, any>
    };
  } catch (error) {
    console.error('Page block creation failed:', error);
    throw error;
  }
};
