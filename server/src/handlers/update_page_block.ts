
import { db } from '../db';
import { pageBlocksTable } from '../db/schema';
import { type UpdatePageBlockInput, type PageBlock } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePageBlock = async (input: UpdatePageBlockInput): Promise<PageBlock> => {
  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.content !== undefined) {
      updateData['content'] = input.content;
    }

    if (input.settings !== undefined) {
      updateData['settings'] = input.settings;
    }

    if (input.sort_order !== undefined) {
      updateData['sort_order'] = input.sort_order;
    }

    // Update the page block
    const result = await db.update(pageBlocksTable)
      .set(updateData)
      .where(eq(pageBlocksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Page block with id ${input.id} not found`);
    }

    // Convert the database result to match the PageBlock schema
    const pageBlock = result[0];
    return {
      id: pageBlock.id,
      page_id: pageBlock.page_id,
      block_template_id: pageBlock.block_template_id,
      content: pageBlock.content as Record<string, any>,
      settings: pageBlock.settings as Record<string, any>,
      sort_order: pageBlock.sort_order,
      created_at: pageBlock.created_at,
      updated_at: pageBlock.updated_at
    };
  } catch (error) {
    console.error('Page block update failed:', error);
    throw error;
  }
};
