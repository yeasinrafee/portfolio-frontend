'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/axios-instance';
import { projectKeys } from '@/lib/hooks/use-projects';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Same schema as Create page
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  shortSummary: z.string().optional(),
  clientName: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  featured: z.boolean().default(false),
  order: z.coerce.number().default(0),
  liveUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  repoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  technologyIds: z.array(z.string()).default([]),
  images: z
    .array(
      z.object({
        id: z.string().optional(), // id is optional for new images
        url: z.string(),
        alt: z.string().optional(),
        order: z.number().default(0),
      }),
    )
    .default([]),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  canonicalUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch single project data[cite: 1]
  const {
    data: projectResponse,
    isLoading: isProjectLoading,
    isError,
  } = useQuery({
    queryKey: projectKeys.detail(slug),
    queryFn: async () => {
      const { data } = await api.get(`/projects/${slug}`);
      return data;
    },
  });

  const project = projectResponse?.data || projectResponse;

  // Fetch technologies[cite: 1]
  const { data: techResponse } = useQuery({
    queryKey: ['technologies'],
    queryFn: async () => {
      const { data } = await api.get('/technologies');
      return data?.data || [];
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      shortSummary: '',
      clientName: '',
      category: '',
      status: 'DRAFT',
      featured: false,
      order: 0,
      liveUrl: '',
      repoUrl: '',
      startDate: '',
      endDate: '',
      technologyIds: [],
      images: [],
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
  });

  // Populate form when project data is loaded
  useEffect(() => {
    if (project) {
      // Format dates for <input type="date" />
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toISOString().split('T')[0];
      };

      form.reset({
        title: project.title || '',
        description: project.description || '',
        shortSummary: project.shortSummary || '',
        clientName: project.clientName || '',
        category: project.category || '',
        status: project.status || 'DRAFT',
        featured: project.featured || false,
        order: project.order || 0,
        liveUrl: project.liveUrl || '',
        repoUrl: project.repoUrl || '',
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        technologyIds: project.technologies?.map((t: any) => t.id) || [],
        // Sort images by order to ensure correct display sequence
        images:
          project.images?.sort((a: any, b: any) => a.order - b.order) || [],
        metaTitle: project.metaTitle || '',
        metaDescription: project.metaDescription || '',
        metaKeywords: project.metaKeywords?.join(', ') || '',
        ogImage: project.ogImage || '',
        canonicalUrl: project.canonicalUrl || '',
      });
    }
  }, [project, form]);

  // Dynamic SEO Fallback watchers
  const watchTitle = form.watch('title');
  const watchImages = form.watch('images');

  const generatedSlug = watchTitle
    ? watchTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    : '{slug}';
  const fallbackCanonical = `https://yourdomain.com/projects/${generatedSlug}`;
  const fallbackOgImage =
    watchImages.length > 0
      ? watchImages[0].url
      : 'First project image (Not uploaded yet)';

  // Image handlers (Same as Create)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const currentImages = form.getValues('images');
      form.setValue('images', [
        ...currentImages,
        { url: data.url, alt: file.name, order: currentImages.length },
      ]);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const currentImages = form.getValues('images');
    const updatedImages = currentImages
      .filter((_, index) => index !== indexToRemove)
      .map((img, index) => ({ ...img, order: index }));
    form.setValue('images', updatedImages);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newImages = [...form.getValues('images')];
    if (direction === 'left' && index > 0) {
      [newImages[index - 1], newImages[index]] = [
        newImages[index],
        newImages[index - 1],
      ];
    } else if (direction === 'right' && index < newImages.length - 1) {
      [newImages[index + 1], newImages[index]] = [
        newImages[index],
        newImages[index + 1],
      ];
    }
    const updatedImages = newImages.map((img, i) => ({ ...img, order: i }));
    form.setValue('images', updatedImages);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!project?.id) return;
    setIsSaving(true);

    try {
      const cleanUrl = (url?: string) =>
        url && url.trim() !== '' ? url : undefined;

      const payload = {
        ...values,
        startDate: values.startDate
          ? new Date(values.startDate).toISOString()
          : null,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        metaKeywords: values.metaKeywords
          ? values.metaKeywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
        liveUrl: cleanUrl(values.liveUrl),
        repoUrl: cleanUrl(values.repoUrl),
        ogImage: cleanUrl(values.ogImage),
        canonicalUrl: cleanUrl(values.canonicalUrl),
        // Strip out image IDs if they exist so backend can recreate them cleanly as per PATCH behavior[cite: 1]
        images: values.images.map((img, idx) => ({
          url: img.url,
          alt: img.alt,
          order: idx,
        })),
      };

      // PATCH request for updating[cite: 1]
      await api.patch(`/projects/${project.id}`, payload);

      toast.success('Project updated successfully!');
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      router.push('/dashboard/projects');
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  }

  if (isProjectLoading) {
    return (
      <div className='flex h-[60vh] items-center justify-center animate-pulse text-muted-foreground'>
        Loading project data...
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className='text-destructive font-medium p-4 bg-destructive/10 border border-destructive/20 rounded-lg'>
        Failed to load project.
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-5xl mx-auto pb-10'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => router.back()}
            className='h-9 w-9 rounded-full'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Edit Project
            </h1>
            <p className='text-sm text-muted-foreground'>
              Update the details of your project.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue='basic' className='w-full block'>
            <TabsList className='grid w-full grid-cols-3 h-12 items-center bg-muted p-1 rounded-lg mb-6'>
              <TabsTrigger value='basic' className='h-full'>
                Basic Info
              </TabsTrigger>
              <TabsTrigger value='media' className='h-full'>
                Media & Tech
              </TabsTrigger>
              <TabsTrigger value='seo' className='h-full'>
                SEO & Links
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Basic Information */}
            <TabsContent value='basic' className='space-y-6 outline-none'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardContent className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='col-span-1 md:col-span-2'>
                    <FormField
                      control={form.control}
                      name='title'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Title *</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='col-span-1 md:col-span-2'>
                    <FormField
                      control={form.control}
                      name='shortSummary'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Summary</FormLabel>
                          <FormControl>
                            <Textarea className='h-20 resize-none' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='col-span-1 md:col-span-2'>
                    <FormField
                      control={form.control}
                      name='description'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description *</FormLabel>
                          <FormControl>
                            <Textarea className='min-h-[200px]' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='category'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. Web App' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='clientName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='startDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='endDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select status' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='DRAFT'>Draft</SelectItem>
                            <SelectItem value='PUBLISHED'>Published</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='order'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Order (Sorting)</FormLabel>
                        <FormControl>
                          <Input type='number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='featured'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-background/50 col-span-1 md:col-span-2'>
                        <div className='space-y-0.5'>
                          <FormLabel>Featured Project</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Media & Technologies */}
            <TabsContent value='media' className='space-y-6 outline-none'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardContent className='p-6 space-y-6'>
                  <div>
                    <FormLabel className='block mb-4'>
                      Project Images (Order affects gallery display)
                    </FormLabel>
                    <div className='flex items-center gap-4 mb-4'>
                      <Button
                        type='button'
                        variant='secondary'
                        disabled={isUploading}
                        className='relative cursor-pointer'
                      >
                        {isUploading ? (
                          'Uploading...'
                        ) : (
                          <>
                            <Upload className='w-4 h-4 mr-2' /> Upload Image
                          </>
                        )}
                        <input
                          type='file'
                          accept='image/*'
                          onChange={handleImageUpload}
                          className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                          disabled={isUploading}
                        />
                      </Button>
                    </div>

                    {watchImages.length > 0 && (
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
                        {watchImages.map((img, idx) => (
                          <div
                            key={idx}
                            className='relative group rounded-lg overflow-hidden border border-border aspect-video bg-muted'
                          >
                            <img
                              src={img.url}
                              alt='Preview'
                              className='w-full h-full object-cover'
                            />

                            <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]'>
                              <button
                                type='button'
                                onClick={() => moveImage(idx, 'left')}
                                disabled={idx === 0}
                                className='p-1.5 bg-white/20 hover:bg-white/40 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                              >
                                <ChevronLeft className='w-4 h-4' />
                              </button>

                              <button
                                type='button'
                                onClick={() => removeImage(idx)}
                                className='p-1.5 bg-destructive hover:bg-destructive/80 rounded text-white transition-colors'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>

                              <button
                                type='button'
                                onClick={() => moveImage(idx, 'right')}
                                disabled={idx === watchImages.length - 1}
                                className='p-1.5 bg-white/20 hover:bg-white/40 rounded text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors'
                              >
                                <ChevronRight className='w-4 h-4' />
                              </button>
                            </div>

                            <div className='absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded'>
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className='pt-6 border-t border-border/50'>
                    <FormField
                      control={form.control}
                      name='technologyIds'
                      render={() => (
                        <FormItem>
                          <div className='mb-4'>
                            <FormLabel className='text-base'>
                              Technologies Used
                            </FormLabel>
                          </div>
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            {techResponse?.map((tech: any) => (
                              <FormField
                                key={tech.id}
                                control={form.control}
                                name='technologyIds'
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={tech.id}
                                      className='flex flex-row items-start space-x-3 space-y-0'
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            tech.id,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  tech.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value: string) =>
                                                      value !== tech.id,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className='font-normal cursor-pointer'>
                                        {tech.name}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: SEO & External Links */}
            <TabsContent value='seo' className='space-y-6 outline-none'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardContent className='p-6 space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <FormField
                      control={form.control}
                      name='liveUrl'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Live URL</FormLabel>
                          <FormControl>
                            <Input placeholder='https://' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='repoUrl'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repository URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='https://github.com/...'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='metaTitle'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name='metaKeywords'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Keywords (comma separated)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='react, nextjs, portfolio'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className='col-span-1 md:col-span-2'>
                      <FormField
                        control={form.control}
                        name='metaDescription'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SEO Description</FormLabel>
                            <FormControl>
                              <Textarea className='h-20' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Accordion
                    type='single'
                    collapsible
                    className='w-full border border-border/50 rounded-lg px-4 bg-muted/20'
                  >
                    <AccordionItem value='advanced-seo' className='border-none'>
                      <AccordionTrigger className='hover:no-underline text-muted-foreground hover:text-foreground text-sm font-medium'>
                        Advanced SEO (Optional)
                      </AccordionTrigger>
                      <AccordionContent className='pt-4 pb-2 border-t border-border/50'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                          <FormField
                            control={form.control}
                            name='ogImage'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Custom Open Graph Image URL
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder='https://...' {...field} />
                                </FormControl>
                                <div className='text-xs text-muted-foreground mt-1.5 space-y-1'>
                                  <p>
                                    Leave empty to auto-fallback for social
                                    sharing.
                                  </p>
                                  <p className='text-primary/80 line-clamp-1 border-l-2 border-primary/50 pl-2'>
                                    Current Fallback: {fallbackOgImage}
                                  </p>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name='canonicalUrl'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Custom Canonical URL</FormLabel>
                                <FormControl>
                                  <Input placeholder='https://...' {...field} />
                                </FormControl>
                                <div className='text-xs text-muted-foreground mt-1.5 space-y-1'>
                                  <p>
                                    Leave empty to let frontend generate it
                                    based on slug.
                                  </p>
                                  <p className='text-primary/80 line-clamp-1 border-l-2 border-primary/50 pl-2'>
                                    Expected Fallback: {fallbackCanonical}
                                  </p>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className='flex justify-end gap-4 mt-8 pt-4'>
            <Button
              variant='outline'
              type='button'
              onClick={() => router.back()}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={isSaving}
              className='bg-primary min-w-[150px]'
            >
              {isSaving ? (
                'Updating...'
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' /> Update Project
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
