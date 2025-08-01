
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { websitesTable, assetsTable } from '../db/schema';
import { type CreateAssetInput } from '../schema';
import { deleteAsset } from '../handlers/delete_asset';
import { eq } from 'drizzle-orm';

describe('deleteAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing asset', async () => {
    // Create a website first (required for foreign key)
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    const website = websiteResult[0];

    // Create an asset
    const assetInput: CreateAssetInput = {
      website_id: website.id,
      filename: 'test-image.jpg',
      original_name: 'original-image.jpg',
      mime_type: 'image/jpeg',
      file_size: 1024,
      url: 'https://example.com/test-image.jpg'
    };

    const assetResult = await db.insert(assetsTable)
      .values(assetInput)
      .returning()
      .execute();

    const asset = assetResult[0];

    // Delete the asset
    const result = await deleteAsset(asset.id);

    expect(result.success).toBe(true);

    // Verify asset is deleted from database
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset.id))
      .execute();

    expect(assets).toHaveLength(0);
  });

  it('should return false when deleting non-existent asset', async () => {
    // Try to delete an asset that doesn't exist
    const result = await deleteAsset(99999);

    expect(result.success).toBe(false);
  });

  it('should not affect other assets when deleting one asset', async () => {
    // Create a website first
    const websiteResult = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: null
      })
      .returning()
      .execute();

    const website = websiteResult[0];

    // Create two assets
    const asset1Input: CreateAssetInput = {
      website_id: website.id,
      filename: 'asset1.jpg',
      original_name: 'original1.jpg',
      mime_type: 'image/jpeg',
      file_size: 1024,
      url: 'https://example.com/asset1.jpg'
    };

    const asset2Input: CreateAssetInput = {
      website_id: website.id,
      filename: 'asset2.jpg',
      original_name: 'original2.jpg',
      mime_type: 'image/jpeg',
      file_size: 2048,
      url: 'https://example.com/asset2.jpg'
    };

    const asset1Result = await db.insert(assetsTable)
      .values(asset1Input)
      .returning()
      .execute();

    const asset2Result = await db.insert(assetsTable)
      .values(asset2Input)
      .returning()
      .execute();

    const asset1 = asset1Result[0];
    const asset2 = asset2Result[0];

    // Delete only the first asset
    const result = await deleteAsset(asset1.id);

    expect(result.success).toBe(true);

    // Verify first asset is deleted
    const deletedAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset1.id))
      .execute();

    expect(deletedAssets).toHaveLength(0);

    // Verify second asset still exists
    const remainingAssets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset2.id))
      .execute();

    expect(remainingAssets).toHaveLength(1);
    expect(remainingAssets[0].filename).toEqual('asset2.jpg');
  });
});
