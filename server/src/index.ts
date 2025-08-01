
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createWebsiteInputSchema,
  updateWebsiteInputSchema,
  createPageInputSchema,
  updatePageInputSchema,
  createPageBlockInputSchema,
  updatePageBlockInputSchema,
  createAssetInputSchema
} from './schema';

// Import handlers
import { createWebsite } from './handlers/create_website';
import { getWebsites } from './handlers/get_websites';
import { getWebsite } from './handlers/get_website';
import { updateWebsite } from './handlers/update_website';
import { deleteWebsite } from './handlers/delete_website';
import { createPage } from './handlers/create_page';
import { getPages } from './handlers/get_pages';
import { getPage } from './handlers/get_page';
import { updatePage } from './handlers/update_page';
import { deletePage } from './handlers/delete_page';
import { getBlockTemplates } from './handlers/get_block_templates';
import { createPageBlock } from './handlers/create_page_block';
import { getPageBlocks } from './handlers/get_page_blocks';
import { updatePageBlock } from './handlers/update_page_block';
import { deletePageBlock } from './handlers/delete_page_block';
import { createAsset } from './handlers/create_asset';
import { getAssets } from './handlers/get_assets';
import { deleteAsset } from './handlers/delete_asset';
import { exportWebsite } from './handlers/export_website';
import { reorderPageBlocks } from './handlers/reorder_page_blocks';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Website management
  createWebsite: publicProcedure
    .input(createWebsiteInputSchema)
    .mutation(({ input }) => createWebsite(input)),
  
  getWebsites: publicProcedure
    .query(() => getWebsites()),
  
  getWebsite: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getWebsite(input.id)),
  
  updateWebsite: publicProcedure
    .input(updateWebsiteInputSchema)
    .mutation(({ input }) => updateWebsite(input)),
  
  deleteWebsite: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteWebsite(input.id)),

  // Page management
  createPage: publicProcedure
    .input(createPageInputSchema)
    .mutation(({ input }) => createPage(input)),
  
  getPages: publicProcedure
    .input(z.object({ websiteId: z.number() }))
    .query(({ input }) => getPages(input.websiteId)),
  
  getPage: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getPage(input.id)),
  
  updatePage: publicProcedure
    .input(updatePageInputSchema)
    .mutation(({ input }) => updatePage(input)),
  
  deletePage: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePage(input.id)),

  // Block templates
  getBlockTemplates: publicProcedure
    .query(() => getBlockTemplates()),

  // Page blocks management
  createPageBlock: publicProcedure
    .input(createPageBlockInputSchema)
    .mutation(({ input }) => createPageBlock(input)),
  
  getPageBlocks: publicProcedure
    .input(z.object({ pageId: z.number() }))
    .query(({ input }) => getPageBlocks(input.pageId)),
  
  updatePageBlock: publicProcedure
    .input(updatePageBlockInputSchema)
    .mutation(({ input }) => updatePageBlock(input)),
  
  deletePageBlock: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePageBlock(input.id)),
  
  reorderPageBlocks: publicProcedure
    .input(z.object({ blockIds: z.array(z.number()) }))
    .mutation(({ input }) => reorderPageBlocks(input.blockIds)),

  // Asset management
  createAsset: publicProcedure
    .input(createAssetInputSchema)
    .mutation(({ input }) => createAsset(input)),
  
  getAssets: publicProcedure
    .input(z.object({ websiteId: z.number() }))
    .query(({ input }) => getAssets(input.websiteId)),
  
  deleteAsset: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteAsset(input.id)),

  // Website export
  exportWebsite: publicProcedure
    .input(z.object({ websiteId: z.number() }))
    .query(({ input }) => exportWebsite(input.websiteId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
