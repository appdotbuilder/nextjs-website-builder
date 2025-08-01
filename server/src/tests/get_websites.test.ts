
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { getWebsites } from '../handlers/get_websites';

describe('getWebsites', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no websites exist', async () => {
    const result = await getWebsites();

    expect(result).toEqual([]);
  });

  it('should return all websites', async () => {
    // Create test websites
    await db.insert(websitesTable)
      .values([
        {
          name: 'Website One',
          domain: 'example1.com',
          is_published: true
        },
        {
          name: 'Website Two',
          domain: 'example2.com',
          is_published: false
        },
        {
          name: 'Website Three',
          domain: null,
          is_published: true
        }
      ])
      .execute();

    const result = await getWebsites();

    expect(result).toHaveLength(3);
    
    // Check first website
    expect(result[0].name).toEqual('Website One');
    expect(result[0].domain).toEqual('example1.com');
    expect(result[0].is_published).toEqual(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second website
    expect(result[1].name).toEqual('Website Two');
    expect(result[1].domain).toEqual('example2.com');
    expect(result[1].is_published).toEqual(false);

    // Check third website (with null domain)
    expect(result[2].name).toEqual('Website Three');
    expect(result[2].domain).toBeNull();
    expect(result[2].is_published).toEqual(true);

    // Verify all websites have required fields
    result.forEach(website => {
      expect(website.id).toBeDefined();
      expect(typeof website.name).toBe('string');
      expect(typeof website.is_published).toBe('boolean');
      expect(website.created_at).toBeInstanceOf(Date);
      expect(website.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return websites in insertion order', async () => {
    // Create websites in specific order
    const website1 = await db.insert(websitesTable)
      .values({ name: 'First Website', domain: 'first.com' })
      .returning()
      .execute();

    const website2 = await db.insert(websitesTable)
      .values({ name: 'Second Website', domain: 'second.com' })
      .returning()
      .execute();

    const result = await getWebsites();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Website');
    expect(result[1].name).toEqual('Second Website');
    expect(result[0].id).toEqual(website1[0].id);
    expect(result[1].id).toEqual(website2[0].id);
  });
});
