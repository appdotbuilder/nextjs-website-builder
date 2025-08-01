
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable } from '../db/schema';
import { type CreateWebsiteInput } from '../schema';
import { createWebsite } from '../handlers/create_website';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateWebsiteInput = {
  name: 'Test Website',
  domain: 'test.example.com'
};

describe('createWebsite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a website', async () => {
    const result = await createWebsite(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Website');
    expect(result.domain).toEqual('test.example.com');
    expect(result.is_published).toEqual(false); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save website to database', async () => {
    const result = await createWebsite(testInput);

    // Query using proper drizzle syntax
    const websites = await db.select()
      .from(websitesTable)
      .where(eq(websitesTable.id, result.id))
      .execute();

    expect(websites).toHaveLength(1);
    expect(websites[0].name).toEqual('Test Website');
    expect(websites[0].domain).toEqual('test.example.com');
    expect(websites[0].is_published).toEqual(false);
    expect(websites[0].created_at).toBeInstanceOf(Date);
    expect(websites[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create website with null domain', async () => {
    const inputWithNullDomain: CreateWebsiteInput = {
      name: 'Test Website No Domain',
      domain: null
    };

    const result = await createWebsite(inputWithNullDomain);

    expect(result.name).toEqual('Test Website No Domain');
    expect(result.domain).toBeNull();
    expect(result.is_published).toEqual(false);
    expect(result.id).toBeDefined();
  });

  it('should set default values correctly', async () => {
    const result = await createWebsite(testInput);

    // Verify database defaults are applied
    expect(result.is_published).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify timestamps are recent (within last minute)
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000);
    expect(result.created_at >= minuteAgo).toBe(true);
    expect(result.updated_at >= minuteAgo).toBe(true);
  });
});
