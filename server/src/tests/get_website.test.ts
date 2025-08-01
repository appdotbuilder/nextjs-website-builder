
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { getWebsite } from '../handlers/get_website';

describe('getWebsite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return website when it exists', async () => {
    // Create a test website
    const insertResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'example.com',
        is_published: true
      })
      .returning()
      .execute();

    const createdWebsite = insertResult[0];

    // Fetch the website using the handler
    const result = await getWebsite(createdWebsite.id);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdWebsite.id);
    expect(result!.name).toEqual('Test Website');
    expect(result!.domain).toEqual('example.com');
    expect(result!.is_published).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when website does not exist', async () => {
    const result = await getWebsite(999);
    expect(result).toBeNull();
  });

  it('should return website with null domain', async () => {
    // Create a website without domain
    const insertResult = await db.insert(websitesTable)
      .values({
        name: 'No Domain Website',
        domain: null,
        is_published: false
      })
      .returning()
      .execute();

    const createdWebsite = insertResult[0];

    // Fetch the website
    const result = await getWebsite(createdWebsite.id);

    // Verify null domain is handled correctly
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('No Domain Website');
    expect(result!.domain).toBeNull();
    expect(result!.is_published).toEqual(false);
  });

  it('should return correct website when multiple exist', async () => {
    // Create multiple websites
    const website1 = await db.insert(websitesTable)
      .values({
        name: 'Website One',
        domain: 'one.com',
        is_published: true
      })
      .returning()
      .execute();

    const website2 = await db.insert(websitesTable)
      .values({
        name: 'Website Two',
        domain: 'two.com',
        is_published: false
      })
      .returning()
      .execute();

    // Fetch specific website
    const result = await getWebsite(website2[0].id);

    // Verify correct website is returned
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(website2[0].id);
    expect(result!.name).toEqual('Website Two');
    expect(result!.domain).toEqual('two.com');
    expect(result!.is_published).toEqual(false);
  });

  it('should handle website with default values', async () => {
    // Create website with minimal data (relying on defaults)
    const insertResult = await db.insert(websitesTable)
      .values({
        name: 'Minimal Website'
        // domain is undefined (will be null)
        // is_published will use default (false)
      })
      .returning()
      .execute();

    const createdWebsite = insertResult[0];

    // Fetch the website
    const result = await getWebsite(createdWebsite.id);

    // Verify defaults are applied correctly
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Minimal Website');
    expect(result!.domain).toBeNull();
    expect(result!.is_published).toEqual(false); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
