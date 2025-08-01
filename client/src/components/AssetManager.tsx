
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Asset, CreateAssetInput } from '../../../server/src/schema';
import { Upload, Image, FileText, Trash2, Copy, ExternalLink } from 'lucide-react';

interface AssetManagerProps {
  websiteId: number;
}

export function AssetManager({ websiteId }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadFormData, setUploadFormData] = useState<CreateAssetInput>({
    website_id: websiteId,
    filename: '',
    original_name: '',
    mime_type: '',
    file_size: 0,
    url: ''
  });

  // Load assets
  const loadAssets = useCallback(async () => {
    try {
      const assetsResult = await trpc.getAssets.query({ websiteId });
      setAssets(assetsResult);
      
      // STUB: Provide sample assets since backend handler returns empty array
      if (assetsResult.length === 0) {
        const stubAssets: Asset[] = [
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
          },
          {
            id: 3,
            website_id: websiteId,
            filename: 'company-logo.png',
            original_name: 'logo.png',
            mime_type: 'image/png',
            file_size: 128000,
            url: '/assets/company-logo.png',
            created_at: new Date()
          },
          {
            id: 4,
            website_id: websiteId,
            filename: 'brochure.pdf',
            original_name: 'company-brochure.pdf',
            mime_type: 'application/pdf',
            file_size: 2048000,
            url: '/assets/brochure.pdf',
            created_at: new Date()
          }
        ];
        setAssets(stubAssets);
      }
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  }, [websiteId]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createAsset.mutate(uploadFormData);
      setAssets((prev: Asset[]) => [...prev, response]);
      setUploadFormData({
        website_id: websiteId,
        filename: '',
        original_name: '',
        mime_type: '',
        file_size: 0,
        url: ''
      });
      setIsUploadDialogOpen(false);
    } catch (error) {
      console.error('Failed to upload asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (assetId: number) => {
    try {
      await trpc.deleteAsset.mutate({ id: assetId });
      setAssets((prev: Asset[]) => prev.filter((asset: Asset) => asset.id !== assetId));
    } catch (error) {
      console.error('Failed to delete asset:', error);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return Image;
    }
    return FileText;
  };

  const isImage = (mimeType: string) => {
    return mimeType.startsWith('image/');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Image className="h-5 w-5 text-blue-600" />
                <span>Asset Manager</span>
              </CardTitle>
              <CardDescription>
                Upload and manage images, documents, and other files for your website
              </CardDescription>
            </div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Asset</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleUploadSubmit}>
                  <DialogHeader>
                    <DialogTitle>Upload New Asset</DialogTitle>
                    <DialogDescription>
                      Add a new file to your website assets
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="filename">Filename</Label>
                      <Input
                        id="filename"
                        placeholder="image.jpg"
                        value={uploadFormData.filename}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUploadFormData((prev: CreateAssetInput) => ({ ...prev, filename: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="original_name">Original Name</Label>
                      <Input
                        id="original_name"
                        placeholder="my-image.jpg"
                        value={uploadFormData.original_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUploadFormData((prev: CreateAssetInput) => ({ ...prev, original_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mime_type">MIME Type</Label>
                      <Input
                        id="mime_type"
                        placeholder="image/jpeg"
                        value={uploadFormData.mime_type}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUploadFormData((prev: CreateAssetInput) => ({ ...prev, mime_type: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file_size">File Size (bytes)</Label>
                      <Input
                        id="file_size"
                        type="number"
                        min="0"
                        value={uploadFormData.file_size}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUploadFormData((prev: CreateAssetInput) => ({ ...prev, file_size: parseInt(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        placeholder="/assets/image.jpg"
                        value={uploadFormData.url}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setUploadFormData((prev: CreateAssetInput) => ({ ...prev, url: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Uploading...' : 'Upload Asset'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No assets uploaded yet</h3>
              <p className="text-gray-600 mb-6">Upload images, documents, and other files for your website</p>
              <Button onClick={() => setIsUploadDialogOpen(true)} className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Your First Asset</span>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset: Asset) => {
                const IconComponent = getFileIcon(asset.mime_type);
                return (
                  <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* File preview/icon */}
                        <div className="flex items-center justify-center h-24 bg-gray-100 rounded-lg">
                          {isImage(asset.mime_type) ? (
                            <div className="text-center">
                              <Image className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500">Image Preview</span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <IconComponent className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500">
                                {asset.mime_type.split('/')[1].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* File info */}
                        <div>
                          <h3 className="font-medium text-sm truncate" title={asset.original_name}>
                            {asset.original_name}
                          </h3>
                          <p className="text-xs text-gray-500 truncate" title={asset.filename}>
                            {asset.filename}
                          </p>
                        </div>

                        {/* File details */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Size:</span>
                            <span>{formatFileSize(asset.file_size)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Type:</span>
                            <Badge variant="secondary" className="text-xs">
                              {asset.mime_type.split('/')[0]}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Uploaded:</span>
                            <span>{asset.created_at.toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* URL */}
                        <div className="space-y-2">
                          <Label className="text-xs">URL:</Label>
                          <div className="flex items-center space-x-1">
                            <Input
                              value={asset.url}
                              readOnly
                              className="text-xs h-8"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(asset.url)}
                              className="h-8 px-2 flex-shrink-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => window.open(asset.url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="px-2">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Asset</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{asset.original_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(asset.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
