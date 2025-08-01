
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { type UpdateWebsiteInput } from '../schema';
import { updateWebsite } from '../handlers/update_website';
import { eq } from 'drizzle-orm';

describe('updateWebsite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let existingWebsiteId: number;

  beforeEach(async () => {
    // Create a website to update in each test
    const result = await db.insert(websitesTable)
      .values({
        name: 'Original Website',
        domain: 'original.com',
        is_published: false
      })
      .returning()
      .execute();
    
    existingWebsiteId = result[0].id;
  });

  it('should update website name', async () => {
    const input: UpdateWebsiteInput = {
      id: existingWebsiteId,
      name: 'Updated Website Name'
    };

    const result = await updateWebsite(input);

    expect(result.id).toEqual(existingWebsiteId);
    expect(result.name).toEqual('Updated Website Name');
    expect(result.domain).toEqual('original.com'); // Should remain unchanged
    expect(result.is_published).toBe(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update website domain', async () => {
    const input: UpdateWebsiteInput = {
      id: existingWebsiteId,
      domain: 'updated.com'
    };

    const result = await updateWebsite(input);

    expect(result.id).toEqual(existingWebsiteId);
    expect(result.name).toEqual('Original Website'); // Should remain unchanged
    expect(result.domain).toEqual('updated.com');
    expect(result.is_published).toBe(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update website publish status', async () => {
    const input: UpdateWebsiteInput = {
      id: existingWebsiteId,
      is_published: true
    };

    const result = await updateWebsite(input);

    expect(result.id).toEqual(existingWebsiteId);
    expect(result.name).toEqual('Original Website'); // Should remain unchanged
    expect(result.domain).toEqual('original.com'); // Should remain unchanged
    expect(result.is_published).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateWebsiteInput = {
      id: existingWebsiteId,
      name: 'Multi-Updated Website',
      domain: 'multi-updated.com',
      is_published: true
    };

    const result = await updateWebsite(input);

    expect(result.id).toEqual(existingWebsiteId);
    expect(result.name).toEqual('Multi-Updated Website');
    expect(result.domain).toEqual('multi-updated.com');
    expect(result.is_published).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set domain to null', async () => {
    const input: UpdateWebsiteInput = {
      id: existingWebsiteId,
      domain: null
    };

    const result = await updateWebsite(input);

    expect(result.id).toEqual(existingWebsiteId);
    expect(result.name).toEqual('Original Website'); // Should remain unchanged
    expect(result.domain).toBeNull();
    expect(result.is_published).toBe(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateWebsiteInput = {
      id: existingWebsiteId,
      name: 'Database Updated Website',
      is_published: true
    };

    await updateWebsite(input);

    // Verify changes were persisted to database
    const websites = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, existingWebsiteId))
      .execute();

    expect(websites).toHaveLength(1);
    expect(websites[0].name).toEqual('Database Updated Website');
    expect(websites[0].is_published).toBe(true);
    expect(websites[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent website', async () => {
    const input: UpdateWebsiteInput = {
      id: 999999, // Non-existent ID
      name: 'Non-existent Website'
    };

    expect(updateWebsite(input)).rejects.toThrow(/not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const input: UpdateWebsiteInput = {
      id: existingWebsiteId,
      name: 'Timestamp Test Website'
    };

    // Get original timestamp
    const originalWebsite = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, existingWebsiteId))
      .execute();

    const originalUpdatedAt = originalWebsite[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await updateWebsite(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
