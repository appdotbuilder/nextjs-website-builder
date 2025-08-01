
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { WebsiteManager } from '@/components/WebsiteManager';
import { PageBuilder } from '@/components/PageBuilder';
import { AssetManager } from '@/components/AssetManager';
import { WebsiteExporter } from '@/components/WebsiteExporter';
import type { Website, Page, BlockTemplate } from '../../server/src/schema';
import { Globe, Layout, FileImage, Download, Sparkles } from 'lucide-react';

function App() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [blockTemplates, setBlockTemplates] = useState<BlockTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load websites and block templates
      const [websitesResult, templatesResult] = await Promise.all([
        trpc.getWebsites.query(),
        trpc.getBlockTemplates.query()
      ]);
      
      setWebsites(websitesResult);
      setBlockTemplates(templatesResult);
      
      // STUB: Since backend handlers return empty arrays, provide sample data for demonstration
      if (websitesResult.length === 0) {
        const stubWebsites: Website[] = [
          {
            id: 1,
            name: "My Business Website",
            domain: "mybusiness.com",
            is_published: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 2,
            name: "Portfolio Site",
            domain: null,
            is_published: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        ];
        setWebsites(stubWebsites);
      }

      if (templatesResult.length === 0) {
        const stubTemplates: BlockTemplate[] = [
          {
            id: 1,
            name: "Hero Section",
            category: "Header",
            description: "Large hero section with title, subtitle and CTA button",
            default_content: {
              title: "Welcome to Our Website",
              subtitle: "We provide amazing services",
              buttonText: "Get Started",
              backgroundImage: "/hero-bg.jpg"
            },
            settings_schema: {
              backgroundType: { type: "select", options: ["image", "gradient", "solid"] },
              textAlign: { type: "select", options: ["left", "center", "right"] }
            },
            created_at: new Date()
          },
          {
            id: 2,
            name: "About Us",
            category: "Content",
            description: "About section with text and image",
            default_content: {
              title: "About Us",
              content: "We are a company dedicated to providing excellent services...",
              image: "/about-image.jpg"
            },
            settings_schema: {
              layout: { type: "select", options: ["text-left", "text-right", "text-center"] }
            },
            created_at: new Date()
          },
          {
            id: 3,
            name: "Contact Form",
            category: "Forms",
            description: "Contact form with name, email and message fields",
            default_content: {
              title: "Contact Us",
              subtitle: "Get in touch with us today",
              fields: ["name", "email", "message"]
            },
            settings_schema: {
              submitButtonText: { type: "text", default: "Send Message" },
              showSubtitle: { type: "boolean", default: true }
            },
            created_at: new Date()
          }
        ];
        setBlockTemplates(stubTemplates);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load pages when website is selected
  const loadPages = useCallback(async (websiteId: number) => {
    try {
      const pagesResult = await trpc.getPages.query({ websiteId });
      setPages(pagesResult);
      
      // STUB: Provide sample pages since backend handler returns empty array
      if (pagesResult.length === 0) {
        const stubPages: Page[] = [
          {
            id: 1,
            website_id: websiteId,
            title: "Home",
            slug: "home",
            meta_description: "Welcome to our homepage",
            seo_title: "Home - My Business",
            seo_keywords: "business, services, home",
            is_homepage: true,
            sort_order: 1,
            is_published: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 2,
            website_id: websiteId,
            title: "About",
            slug: "about",
            meta_description: "Learn more about our company",
            seo_title: "About Us - My Business",
            seo_keywords: "about, company, team",
            is_homepage: false,
            sort_order: 2,
            is_published: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 3,
            website_id: websiteId,
            title: "Contact",
            slug: "contact",
            meta_description: "Get in touch with us",
            seo_title: "Contact - My Business",
            seo_keywords: "contact, support, help",
            is_homepage: false,
            sort_order: 3,
            is_published: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        ];
        setPages(stubPages);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedWebsite) {
      loadPages(selectedWebsite.id);
      setSelectedPage(null); // Reset selected page when website changes
    }
  }, [selectedWebsite, loadPages]);

  const handleWebsiteSelect = (website: Website) => {
    setSelectedWebsite(website);
  };

  const handlePageSelect = (page: Page) => {
    setSelectedPage(page);
  };

  const handleWebsiteUpdate = (updatedWebsite: Website) => {
    setWebsites((prev: Website[]) => 
      prev.map((w: Website) => w.id === updatedWebsite.id ? updatedWebsite : w)
    );
    if (selectedWebsite?.id === updatedWebsite.id) {
      setSelectedWebsite(updatedWebsite);
    }
  };

  const handleWebsiteCreate = (newWebsite: Website) => {
    setWebsites((prev: Website[]) => [...prev, newWebsite]);
  };

  const handleWebsiteDelete = (websiteId: number) => {
    setWebsites((prev: Website[]) => prev.filter((w: Website) => w.id !== websiteId));
    if (selectedWebsite?.id === websiteId) {
      setSelectedWebsite(null);
      setSelectedPage(null);
      setPages([]);
    }
  };

  const handlePageUpdate = (updatedPage: Page) => {
    setPages((prev: Page[]) => 
      prev.map((p: Page) => p.id === updatedPage.id ? updatedPage : p)
    );
    if (selectedPage?.id === updatedPage.id) {
      setSelectedPage(updatedPage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading website builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
              <Layout className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Website Builder & CMS</h1>
              <p className="text-gray-600">Create stunning websites with our drag-and-drop builder</p>
            </div>
          </div>
          
          {selectedWebsite && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-blue-600" />
                  <div>
                    <h2 className="font-semibold text-lg">{selectedWebsite.name}</h2>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {selectedWebsite.domain && (
                        <span>{selectedWebsite.domain}</span>
                      )}
                      <Badge variant={selectedWebsite.is_published ? "default" : "secondary"}>
                        {selectedWebsite.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedWebsite(null)}
                  variant="outline"
                  size="sm"
                >
                  ← Back to Websites
                </Button>
              </div>
            </div>
          )}
        </div>

        {!selectedWebsite ? (
          // Website selection view
          <div className="space-y-6">
            <WebsiteManager
              websites={websites}
              onWebsiteSelect={handleWebsiteSelect}
              onWebsiteUpdate={handleWebsiteUpdate}
              onWebsiteCreate={handleWebsiteCreate}
              onWebsiteDelete={handleWebsiteDelete}
            />
          </div>
        ) : (
          // Website builder interface
          <Tabs defaultValue="pages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
              <TabsTrigger value="pages" className="flex items-center space-x-2">
                <Layout className="h-4 w-4" />
                <span>Pages</span>
              </TabsTrigger>
              <TabsTrigger value="builder" disabled={!selectedPage} className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Builder</span>
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center space-x-2">
                <FileImage className="h-4 w-4" />
                <span>Assets</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>Preview</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Page Management</CardTitle>
                  <CardDescription>
                    Create and manage pages for {selectedWebsite.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {pages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Layout className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No pages yet. Create your first page to get started!</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {pages.map((page: Page) => (
                          <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-medium">{page.title}</h3>
                                  {page.is_homepage && (
                                    <Badge variant="outline" className="text-xs">Home</Badge>
                                  )}
                                  <Badge variant={page.is_published ? "default" : "secondary"} className="text-xs">
                                    {page.is_published ? "Published" : "Draft"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">/{page.slug}</p>
                                {page.meta_description && (
                                  <p className="text-xs text-gray-500 mt-1">{page.meta_description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handlePageSelect(page)}
                                size="sm"
                                variant="outline"
                              >
                                Edit Page
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="builder">
              {selectedPage ? (
                <PageBuilder
                  page={selectedPage}
                  blockTemplates={blockTemplates}
                  onPageUpdate={handlePageUpdate}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Layout className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Select a page from the Pages tab to start building</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="assets">
              <AssetManager websiteId={selectedWebsite.id} />
            </TabsContent>

            <TabsContent value="export">
              <WebsiteExporter websiteId={selectedWebsite.id} />
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Website Preview</CardTitle>
                  <CardDescription>
                    Preview how your website will look to visitors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <Globe className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">Preview Coming Soon</h3>
                    <p className="text-gray-600 mb-4">
                      Website preview will show your pages as they appear to visitors
                    </p>
                    {selectedWebsite.domain && (
                      <div className="text-sm text-gray-500">
                        Will be available at: <span className="font-mono">{selectedWebsite.domain}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

export default App;
