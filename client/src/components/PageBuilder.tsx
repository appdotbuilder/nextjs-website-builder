
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import type { Page, BlockTemplate, PageBlock, CreatePageBlockInput, UpdatePageBlockInput } from '../../../server/src/schema';
import { Plus, Move, Edit, Trash2, Sparkles, Type, Mail, Layout } from 'lucide-react';

interface PageBuilderProps {
  page: Page;
  blockTemplates: BlockTemplate[];
  onPageUpdate: (page: Page) => void;
}

export function PageBuilder({ page, blockTemplates }: PageBuilderProps) {
  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>([]);
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null);
  const [isEditBlockDialogOpen, setIsEditBlockDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load page blocks
  const loadPageBlocks = useCallback(async () => {
    try {
      const blocks = await trpc.getPageBlocks.query({ pageId: page.id });
      setPageBlocks(blocks);
      
      // STUB: Provide sample blocks since backend handler returns empty array
      if (blocks.length === 0) {
        const stubBlocks: PageBlock[] = [
          {
            id: 1,
            page_id: page.id,
            block_template_id: 1,
            content: {
              title: "Welcome to Our Website",
              subtitle: "We provide amazing services for your business",
              buttonText: "Get Started Today",
              backgroundImage: "/hero-bg.jpg"
            },
            settings: {
              backgroundType: "image",
              textAlign: "center"
            },
            sort_order: 1,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 2,
            page_id: page.id,
            block_template_id: 2,
            content: {
              title: "About Our Company",
              content: "We are a leading company in our industry, dedicated to providing exceptional services and solutions to our clients worldwide.",
              image: "/about-image.jpg"
            },
            settings: {
              layout: "text-left"
            },
            sort_order: 2,
            created_at: new Date(),
            updated_at: new Date()
          }
        ];
        setPageBlocks(stubBlocks);
      }
    } catch (error) {
      console.error('Failed to load page blocks:', error);
    }
  }, [page.id]);

  useEffect(() => {
    loadPageBlocks();
  }, [loadPageBlocks]);

  const handleAddBlock = async (templateId: number) => {
    setIsLoading(true);
    try {
      const template = blockTemplates.find((t: BlockTemplate) => t.id === templateId);
      if (!template) return;

      const newBlockData: CreatePageBlockInput = {
        page_id: page.id,
        block_template_id: templateId,
        content: template.default_content,
        settings: {},
        sort_order: pageBlocks.length + 1
      };

      const response = await trpc.createPageBlock.mutate(newBlockData);
      setPageBlocks((prev: PageBlock[]) => [...prev, response]);
      setIsAddBlockDialogOpen(false);
    } catch (error) {
      console.error('Failed to add block:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditBlock = (block: PageBlock) => {
    setEditingBlock(block);
    setIsEditBlockDialogOpen(true);
  };

  const handleUpdateBlock = async (updatedContent: Record<string, unknown>, updatedSettings: Record<string, unknown>) => {
    if (!editingBlock) return;

    setIsLoading(true);
    try {
      const updateData: UpdatePageBlockInput = {
        id: editingBlock.id,
        content: updatedContent,
        settings: updatedSettings
      };

      const response = await trpc.updatePageBlock.mutate(updateData);
      setPageBlocks((prev: PageBlock[]) => 
        prev.map((block: PageBlock) => block.id === editingBlock.id ? response : block)
      );
      setIsEditBlockDialogOpen(false);
      setEditingBlock(null);
    } catch (error) {
      console.error('Failed to update block:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBlock = async (blockId: number) => {
    try {
      await trpc.deletePageBlock.mutate({ id: blockId });
      setPageBlocks((prev: PageBlock[]) => prev.filter((block: PageBlock) => block.id !== blockId));
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const getBlockTemplate = (templateId: number) => {
    return blockTemplates.find((template: BlockTemplate) => template.id === templateId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'header': return Layout;
      case 'content': return Type;
      case 'forms': return Mail;
      default: return Layout;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'header': return 'bg-blue-100 text-blue-800';
      case 'content': return 'bg-green-100 text-green-800';
      case 'forms': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <span>Page Builder - {page.title}</span>
              </CardTitle>
              <CardDescription>
                Customize your page by adding and arranging content blocks
              </CardDescription>
            </div>
            <Dialog open={isAddBlockDialogOpen} onOpenChange={setIsAddBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Block</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Choose a Block Template</DialogTitle>
                  <DialogDescription>
                    Select a pre-designed block to add to your page
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-1">
                    {blockTemplates.map((template: BlockTemplate) => {
                      const IconComponent = getCategoryIcon(template.category);
                      return (
                        <Card 
                          key={template.id} 
                          className="cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => handleAddBlock(template.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                <IconComponent className="h-5 w-5 text-gray-600" />
                                <CardTitle className="text-base">{template.name}</CardTitle>
                              </div>
                              <Badge className={getCategoryColor(template.category)} variant="secondary">
                                {template.category}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 mb-3">
                              {template.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              <p>Default content preview:</p>
                              <div className="bg-gray-50 p-2 rounded mt-1 font-mono text-xs">
                                {JSON.stringify(template.default_content, null, 2).substring(0, 100)}...
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {pageBlocks.length === 0 ? (
            <div className="text-center py-12">
              <Layout className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No blocks added yet</h3>
              <p className="text-gray-600 mb-6">Start building your page by adding content blocks</p>
              <Button onClick={() => setIsAddBlockDialogOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Your First Block</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pageBlocks
                .sort((a: PageBlock, b: PageBlock) => a.sort_order - b.sort_order)
                .map((block: PageBlock) => {
                  const template = getBlockTemplate(block.block_template_id);
                  if (!template) return null;

                  const IconComponent = getCategoryIcon(template.category);

                  return (
                    <Card key={block.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <IconComponent className="h-5 w-5 text-gray-600" />
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <Badge className={getCategoryColor(template.category)} variant="secondary">
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center space-x-1"
                            >
                              <Move className="h-3 w-3" />
                              <span>Move</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditBlock(block)}
                              className="flex items-center space-x-1"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteBlock(block.id)}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-500">CONTENT</Label>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                              {Object.entries(block.content).map(([key, value]) => (
                                <div key={key} className="mb-2 last:mb-0">
                                  <span className="font-medium text-gray-700">{key}:</span>{' '}
                                  <span className="text-gray-600">
                                    {typeof value === 'string' ? value : JSON.stringify(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {Object.keys(block.settings).length > 0 && (
                            <div>
                              <Label className="text-xs font-medium text-gray-500">SETTINGS</Label>
                              <div className="bg-blue-50 p-3 rounded text-sm">
                                {Object.entries(block.settings).map(([key, value]) => (
                                  <div key={key} className="mb-2 last:mb-0">
                                    <span className="font-medium text-blue-700">{key}:</span>{' '}
                                    <span className="text-blue-600">
                                      {typeof value === 'string' ? value : JSON.stringify(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Block Dialog */}
      <Dialog open={isEditBlockDialogOpen} onOpenChange={setIsEditBlockDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Block Content</DialogTitle>
            <DialogDescription>
              Customize the content and settings for this block
            </DialogDescription>
          </DialogHeader>
          {editingBlock && (
            <BlockEditor
              block={editingBlock}
              template={getBlockTemplate(editingBlock.block_template_id)}
              onSave={handleUpdateBlock}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BlockEditorProps {
  block: PageBlock;
  template: BlockTemplate | undefined;
  onSave: (content: Record<string, unknown>, settings: Record<string, unknown>) => void;
  isLoading: boolean;
}

function BlockEditor({ block, template, onSave, isLoading }: BlockEditorProps) {
  const [content, setContent] = useState(block.content);
  const [settings, setSettings] = useState(block.settings);

  if (!template) {
    return <div>Template not found</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(content, settings);
  };

  const updateContent = (key: string, value: unknown) => {
    setContent((prev: Record<string, unknown>) => ({ ...prev, [key]: value }));
  };

  const updateSettings = (key: string, value: unknown) => {
    setSettings((prev: Record<string, unknown>) => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollArea className="max-h-96">
      <form onSubmit={handleSubmit} className="space-y-6 p-1">
        <div>
          <Label className="text-sm font-medium mb-3 block">Content</Label>
          <div className="space-y-4">
            {Object.entries(template.default_content).map(([key, defaultValue]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`content-${key}`} className="text-xs font-medium text-gray-600">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Label>
                {typeof defaultValue === 'string' && defaultValue.length > 50 ? (
                  <Textarea
                    id={`content-${key}`}
                    value={String(content[key] || defaultValue)}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      updateContent(key, e.target.value)
                    }
                    className="min-h-20"
                  />
                ) : (
                  <Input
                    id={`content-${key}`}
                    value={String(content[key] || defaultValue)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      updateContent(key, e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium mb-3 block">Settings</Label>
          <div className="space-y-4">
            {Object.entries(template.settings_schema).map(([key, schema]: [string, Record<string, unknown>]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`settings-${key}`} className="text-xs font-medium text-gray-600">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Label>
                <Input
                  id={`settings-${key}`}
                  value={String(settings[key] || '')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateSettings(key, e.target.value)
                  }
                  placeholder={String(schema.default || '')}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </ScrollArea>
  );
}
