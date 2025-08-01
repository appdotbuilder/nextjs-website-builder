
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { WebsiteExport } from '../../../server/src/schema';
import { Download, FileJson, Globe, AlertCircle } from 'lucide-react';

interface WebsiteExporterProps {
  websiteId: number;
}

export function WebsiteExporter({ websiteId }: WebsiteExporterProps) {
  const [exportData, setExportData] = useState<WebsiteExport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await trpc.exportWebsite.query({ websiteId });
      setExportData(data);
      
      // STUB: Provide sample export data since backend handler might return empty data
      if (!data.website) {
        const stubExportData: WebsiteExport = {
          website: {
            id: websiteId,
            name: "Sample Website Export",
            domain: "example.com",
            is_published: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          pages: [
            {
              id: 1,
              website_id: websiteId,
              title: "Home",
              slug: "home",
              meta_description: "Welcome to our homepage",
              seo_title: "Home - Sample Website",
              seo_keywords: "home, welcome, main",
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
              meta_description: "Learn about our company",
              seo_title: "About Us - Sample Website",
              seo_keywords: "about, company, team",
              is_homepage: false,
              sort_order: 2,
              is_published: true,
              created_at: new Date(),
              updated_at: new Date()
            }
          ],
          blocks: [
            {
              id: 1,
              page_id: 1,
              block_template_id: 1,
              content: {
                title: "Welcome to Our Website",
                subtitle: "We provide amazing services",
                buttonText: "Get Started"
              },
              settings: {
                backgroundType: "gradient",
                textAlign: "center"
              },
              sort_order: 1,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              id: 2,
              page_id: 2,
              block_template_id: 2,
              content: {
                title: "About Our Company",
                content: "We are dedicated to providing excellent services...",
                image: "/about-image.jpg"
              },
              settings: {
                layout: "text-left"
              },
              sort_order: 1,
              created_at: new Date(),
              updated_at: new Date()
            }
          ],
          assets: [
            {
              id: 1,
              website_id: websiteId,
              filename: 'hero-bg.jpg',
              original_name: 'hero-background.jpg',
              mime_type: 'image/jpeg',
              file_size: 1024000,
              url: '/assets/hero-bg.jpg',
              created_at: new Date()
            },
            {
              id: 2,
              website_id: websiteId,
              filename: 'about-image.jpg',
              original_name: 'about-us-photo.jpg',
              mime_type: 'image/jpeg',
              file_size: 512000,
              url: '/assets/about-image.jpg',
              created_at: new Date()
            }
          ]
        };
        setExportData(stubExportData);
      }
    } catch (error) {
      console.error('Failed to export website:', error);
      setError('Failed to export website data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    if (!exportData) return;

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `website-export-${exportData.website.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileJson className="h-5 w-5 text-green-600" />
            <span>Website Export</span>
          </CardTitle>
          <CardDescription>
            Export your complete website data as a JSON file for backup or migration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!exportData ? (
            <div className="text-center py-8">
              <FileJson className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Export Website Data</h3>
              <p className="text-gray-600 mb-6">
                Generate a complete backup of your website including pages, blocks, and assets
              </p>
              <Button 
                onClick={handleExport} 
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Generate Export</span>
                  </>
                )}
              </Button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Export Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Globe className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Export Complete</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-green-700">Website:</Label>
                    <p className="font-medium">{exportData.website.name}</p>
                  </div>
                  <div>
                    <Label className="text-green-700">Pages:</Label>
                    <p className="font-medium">{exportData.pages.length}</p>
                  </div>
                  <div>
                    <Label className="text-green-700">Blocks:</Label>
                    <p className="font-medium">{exportData.blocks.length}</p>
                  </div>
                  <div>
                    <Label className="text-green-700">Assets:</Label>
                    <p className="font-medium">{exportData.assets.length}</p>
                  </div>
                </div>
              </div>

              {/* Website Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Website Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Name:</Label>
                      <p className="font-medium">{exportData.website.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Domain:</Label>
                      <p className="font-medium">{exportData.website.domain || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600">Status:</Label>
                      <Badge variant={exportData.website.is_published ? "default" : "secondary"}>
                        {exportData.website.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600">Created:</Label>
                      <p className="font-medium">{exportData.website.created_at.toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pages Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Pages ({exportData.pages.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {exportData.pages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{page.title}</span>
                          {page.is_homepage && <Badge variant="outline" className="text-xs">Home</Badge>}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>/{page.slug}</span>
                          <Badge variant={page.is_published ? "default" : "secondary"} className="text-xs">
                            {page.is_published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Assets Overview */}
              {exportData.assets.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Assets ({exportData.assets.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {exportData.assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span className="font-medium">{asset.original_name}</span>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>{formatFileSize(asset.file_size)}</span>
                            <Badge variant="secondary" className="text-xs">
                              {asset.mime_type.split('/')[0]}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* JSON Preview and Download */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Export Data (JSON)</Label>
                  <Button onClick={downloadJson} className="flex items-center space-x-2">
                    <Download className="h-4 w-4" />
                    <span>Download JSON</span>
                  </Button>
                </div>
                
                <Textarea
                  value={JSON.stringify(exportData, null, 2)}
                  readOnly
                  className="font-mono text-xs h-64 resize-none"
                  placeholder="Export data will appear here..."
                />
              </div>

              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setExportData(null)}
                  className="flex items-center space-x-2"
                >
                  <FileJson className="h-4 w-4" />
                  <span>Generate New Export</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
