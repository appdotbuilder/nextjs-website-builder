
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, assetsTable } from '../db/schema';
import { type CreateWebsiteInput, type CreateAssetInput } from '../schema';
import { getAssets } from '../handlers/get_assets';

// Test data
const testWebsite: CreateWebsiteInput = {
  name: 'Test Website',
  domain: 'test.com'
};

const testAsset1: CreateAssetInput = {
  website_id: 1, // Will be updated after website creation
  filename: 'image1.jpg',
  original_name: 'my-image.jpg',
  mime_type: 'image/jpeg',
  file_size: 1024,
  url: 'https://example.com/image1.jpg'
};

const testAsset2: CreateAssetInput = {
  website_id: 1, // Will be updated after website creation
  filename: 'document.pdf',
  original_name: 'important-doc.pdf',
  mime_type: 'application/pdf',
  file_size: 2048,
  url: 'https://example.com/document.pdf'
};

describe('getAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no assets exist', async () => {
    // Create website first
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: testWebsite.name,
        domain: testWebsite.domain
      })
      .returning()
      .execute();

    const websiteId = websiteResult[0].id;
    const result = await getAssets(websiteId);

    expect(result).toEqual([]);
  });

  it('should return all assets for a website', async () => {
    // Create website first
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: testWebsite.name,
        domain: testWebsite.domain
      })
      .returning()
      .execute();

    const websiteId = websiteResult[0].id;

    // Create assets
    await db.insert(assetsTable)
      .values([
        {
          ...testAsset1,
          website_id: websiteId
        },
        {
          ...testAsset2,
          website_id: websiteId
        }
      ])
      .execute();

    const result = await getAssets(websiteId);

    expect(result).toHaveLength(2);
    expect(result[0].filename).toEqual('image1.jpg');
    expect(result[0].original_name).toEqual('my-image.jpg');
    expect(result[0].mime_type).toEqual('image/jpeg');
    expect(result[0].file_size).toEqual(1024);
    expect(result[0].url).toEqual('https://example.com/image1.jpg');
    expect(result[0].website_id).toEqual(websiteId);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].filename).toEqual('document.pdf');
    expect(result[1].original_name).toEqual('important-doc.pdf');
    expect(result[1].mime_type).toEqual('application/pdf');
    expect(result[1].file_size).toEqual(2048);
    expect(result[1].url).toEqual('https://example.com/document.pdf');
    expect(result[1].website_id).toEqual(websiteId);
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should only return assets for the specified website', async () => {
    // Create two websites
    const website1Result = await db.insert(websitesTable)
      .values({
        name: 'Website 1',
        domain: 'site1.com'
      })
      .returning()
      .execute();

    const website2Result = await db.insert(websitesTable)
      .values({
        name: 'Website 2',
        domain: 'site2.com'
      })
      .returning()
      .execute();

    const website1Id = website1Result[0].id;
    const website2Id = website2Result[0].id;

    // Create assets for both websites
    await db.insert(assetsTable)
      .values([
        {
          ...testAsset1,
          website_id: website1Id
        },
        {
          ...testAsset2,
          website_id: website2Id
        }
      ])
      .execute();

    // Get assets for website 1 only
    const result = await getAssets(website1Id);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toEqual('image1.jpg');
    expect(result[0].website_id).toEqual(website1Id);
  });

  it('should return assets ordered by creation date', async () => {
    // Create website first
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: testWebsite.name,
        domain: testWebsite.domain
      })
      .returning()
      .execute();

    const websiteId = websiteResult[0].id;

    // Create first asset
    await db.insert(assetsTable)
      .values({
        ...testAsset1,
        website_id: websiteId
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    // Create second asset
    await db.insert(assetsTable)
      .values({
        ...testAsset2,
        website_id: websiteId
      })
      .execute();

    const result = await getAssets(websiteId);

    expect(result).toHaveLength(2);
    // Verify that the first asset was created before the second
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });
});
