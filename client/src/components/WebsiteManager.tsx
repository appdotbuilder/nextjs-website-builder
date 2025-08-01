
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { Website, CreateWebsiteInput, UpdateWebsiteInput } from '../../../server/src/schema';
import { Globe, Plus, Edit, Trash2, ExternalLink, Layout } from 'lucide-react';

interface WebsiteManagerProps {
  websites: Website[];
  onWebsiteSelect: (website: Website) => void;
  onWebsiteUpdate: (website: Website) => void;
  onWebsiteCreate: (website: Website) => void;
  onWebsiteDelete: (websiteId: number) => void;
}

export function WebsiteManager({
  websites,
  onWebsiteSelect,
  onWebsiteUpdate,
  onWebsiteCreate,
  onWebsiteDelete
}: WebsiteManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateWebsiteInput>({
    name: '',
    domain: null
  });

  const [editFormData, setEditFormData] = useState<UpdateWebsiteInput>({
    id: 0,
    name: '',
    domain: null,
    is_published: false
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createWebsite.mutate(createFormData);
      onWebsiteCreate(response);
      setCreateFormData({ name: '', domain: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create website:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.updateWebsite.mutate(editFormData);
      onWebsiteUpdate(response);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update website:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (website: Website) => {
    setEditFormData({
      id: website.id,
      name: website.name,
      domain: website.domain,
      is_published: website.is_published
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (websiteId: number) => {
    try {
      await trpc.deleteWebsite.mutate({ id: websiteId });
      onWebsiteDelete(websiteId);
    } catch (error) {
      console.error('Failed to delete website:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Websites</h2>
          <p className="text-gray-600">Manage and build your websites</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Website</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateSubmit}>
              <DialogHeader>
                <DialogTitle>Create New Website</DialogTitle>
                <DialogDescription>
                  Start building your new website by giving it a name and optional domain.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Website Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Website"
                    value={createFormData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateWebsiteInput) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain (Optional)</Label>
                  <Input
                    id="domain"
                    placeholder="mywebsite.com"
                    value={createFormData.domain || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCreateFormData((prev: CreateWebsiteInput) => ({ 
                        ...prev, 
                        domain: e.target.value || null 
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Website'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {websites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Globe className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No websites yet</h3>
            <p className="text-gray-600 mb-6">Create your first website to get started with the builder</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Your First Website</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((website: Website) => (
            <Card key={website.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{website.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {website.domain ? (
                        <div className="flex items-center space-x-1">
                          <ExternalLink className="h-3 w-3" />
                          <span>{website.domain}</span>
                        </div>
                      ) : (
                        'No domain set'
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={website.is_published ? "default" : "secondary"}>
                    {website.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p>Created: {website.created_at.toLocaleDateString()}</p>
                  <p>Updated: {website.updated_at.toLocaleDateString()}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => onWebsiteSelect(website)}
                    className="flex-1"
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    Edit Website
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(website)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Website</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{website.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(website.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Website Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Website</DialogTitle>
              <DialogDescription>
                Update your website settings and configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Website Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateWebsiteInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-domain">Domain</Label>
                <Input
                  id="edit-domain"
                  placeholder="mywebsite.com"
                  value={editFormData.domain || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditFormData((prev: UpdateWebsiteInput) => ({ 
                      ...prev, 
                      domain: e.target.value || null 
                    }))
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-published"
                  checked={editFormData.is_published || false}
                  onCheckedChange={(checked: boolean) =>
                    setEditFormData((prev: UpdateWebsiteInput) => ({ ...prev, is_published: checked }))
                  }
                />
                <Label htmlFor="edit-published">Published</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Website'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
