
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blockTemplatesTable } from '../db/schema';
import { getBlockTemplates } from '../handlers/get_block_templates';

describe('getBlockTemplates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no block templates exist', async () => {
    const result = await getBlockTemplates();
    expect(result).toEqual([]);
  });

  it('should return all block templates', async () => {
    // Create test block templates
    await db.insert(blockTemplatesTable).values([
      {
        name: 'Hero Block',
        category: 'header',
        description: 'Hero section with title and CTA',
        default_content: { title: 'Welcome', subtitle: 'Get started today' },
        settings_schema: { title: { type: 'string' }, subtitle: { type: 'string' } }
      },
      {
        name: 'Text Block',
        category: 'content',
        description: 'Simple text content block',
        default_content: { text: 'Lorem ipsum' },
        settings_schema: { text: { type: 'string' } }
      }
    ]).execute();

    const result = await getBlockTemplates();

    expect(result).toHaveLength(2);
    
    // Check first template
    const heroBlock = result.find(template => template.name === 'Hero Block');
    expect(heroBlock).toBeDefined();
    expect(heroBlock?.category).toEqual('header');
    expect(heroBlock?.description).toEqual('Hero section with title and CTA');
    expect(heroBlock?.default_content).toEqual({ title: 'Welcome', subtitle: 'Get started today' });
    expect(heroBlock?.settings_schema).toEqual({ title: { type: 'string' }, subtitle: { type: 'string' } });
    expect(heroBlock?.id).toBeDefined();
    expect(heroBlock?.created_at).toBeInstanceOf(Date);

    // Check second template
    const textBlock = result.find(template => template.name === 'Text Block');
    expect(textBlock).toBeDefined();
    expect(textBlock?.category).toEqual('content');
    expect(textBlock?.description).toEqual('Simple text content block');
    expect(textBlock?.default_content).toEqual({ text: 'Lorem ipsum' });
    expect(textBlock?.settings_schema).toEqual({ text: { type: 'string' } });
    expect(textBlock?.id).toBeDefined();
    expect(textBlock?.created_at).toBeInstanceOf(Date);
  });

  it('should handle templates with null description', async () => {
    await db.insert(blockTemplatesTable).values({
      name: 'Basic Block',
      category: 'misc',
      description: null,
      default_content: {},
      settings_schema: {}
    }).execute();

    const result = await getBlockTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic Block');
    expect(result[0].description).toBeNull();
    expect(result[0].default_content).toEqual({});
    expect(result[0].settings_schema).toEqual({});
  });
});
