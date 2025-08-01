
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, websitesTable } from '../db/schema';
import { type CreateAssetInput } from '../schema';
import { createAsset } from '../handlers/create_asset';
import { eq } from 'drizzle-orm';

// Test input for asset creation
const testAssetInput: CreateAssetInput = {
  website_id: 1,
  filename: 'test-image.jpg',
  original_name: 'original-test-image.jpg',
  mime_type: 'image/jpeg',
  file_size: 1024000,
  url: 'https://example.com/uploads/test-image.jpg'
};

describe('createAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test website
  const createTestWebsite = async () => {
    const result = await db.insert(websitesTable)
      .values({
        name: 'Test Website',
        domain: 'test.com',
        is_published: false
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create an asset', async () => {
    // Create prerequisite website
    const website = await createTestWebsite();
    const input = { ...testAssetInput, website_id: website.id };

    const result = await createAsset(input);

    // Basic field validation
    expect(result.website_id).toEqual(website.id);
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.original_name).toEqual('original-test-image.jpg');
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.file_size).toEqual(1024000);
    expect(result.url).toEqual('https://example.com/uploads/test-image.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save asset to database', async () => {
    // Create prerequisite website
    const website = await createTestWebsite();
    const input = { ...testAssetInput, website_id: website.id };

    const result = await createAsset(input);

    // Query database to verify the asset was saved
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, result.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].website_id).toEqual(website.id);
    expect(assets[0].filename).toEqual('test-image.jpg');
    expect(assets[0].original_name).toEqual('original-test-image.jpg');
    expect(assets[0].mime_type).toEqual('image/jpeg');
    expect(assets[0].file_size).toEqual(1024000);
    expect(assets[0].url).toEqual('https://example.com/uploads/test-image.jpg');
    expect(assets[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when website does not exist', async () => {
    const input = { ...testAssetInput, website_id: 999 };

    await expect(createAsset(input)).rejects.toThrow(/website with id 999 not found/i);
  });

  it('should handle different file types correctly', async () => {
    // Create prerequisite website
    const website = await createTestWebsite();

    // Test PDF file
    const pdfInput: CreateAssetInput = {
      website_id: website.id,
      filename: 'document.pdf',
      original_name: 'important-document.pdf',
      mime_type: 'application/pdf',
      file_size: 2048000,
      url: 'https://example.com/uploads/document.pdf'
    };

    const pdfResult = await createAsset(pdfInput);

    expect(pdfResult.mime_type).toEqual('application/pdf');
    expect(pdfResult.file_size).toEqual(2048000);
    expect(pdfResult.filename).toEqual('document.pdf');

    // Test PNG image
    const pngInput: CreateAssetInput = {
      website_id: website.id,
      filename: 'icon.png',
      original_name: 'app-icon.png',
      mime_type: 'image/png',
      file_size: 512000,
      url: 'https://example.com/uploads/icon.png'
    };

    const pngResult = await createAsset(pngInput);

    expect(pngResult.mime_type).toEqual('image/png');
    expect(pngResult.file_size).toEqual(512000);
    expect(pngResult.filename).toEqual('icon.png');
  });
});
