/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/axios-instance';
import { useCategories } from '@/lib/hooks/use-categories';
import { blogKeys } from '@/lib/hooks/use-blogs';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  categoryId: z.string().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  featured: z.boolean().default(false),
  readingTimeMins: z.coerce.number().optional(),
  tags: z.string().optional(),
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

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const slug = params.slug as string;

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories('BLOG');

  const {
    data: blogResponse,
    isLoading: isBlogLoading,
    isError,
  } = useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: async () => {
      const { data } = await api.get(`/blog/${slug}`);
      return data;
    },
  });

  const blog = blogResponse?.data || blogResponse;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      coverImage: '',
      categoryId: '',
      status: 'DRAFT',
      featured: false,
      readingTimeMins: 1,
      tags: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      ogImage: '',
      canonicalUrl: '',
    },
  });

  useEffect(() => {
    if (blog) {
      form.reset({
        title: blog.title || '',
        content: blog.content || '',
        excerpt: blog.excerpt || '',
        coverImage: blog.coverImage || '',
        categoryId: blog.categoryId || blog.category?.id || 'NONE',
        status: blog.status || 'DRAFT',
        featured: blog.featured || false,
        readingTimeMins: blog.readingTimeMins || 1,
        tags: blog.tags?.join(', ') || '',
        metaTitle: blog.metaTitle || '',
        metaDescription: blog.metaDescription || '',
        metaKeywords: blog.metaKeywords?.join(', ') || '',
        ogImage: blog.ogImage || '',
        canonicalUrl: blog.canonicalUrl || '',
      });
    }
  }, [blog, form]);

  const watchTitle = form.watch('title');
  const watchCoverImage = form.watch('coverImage');

  const generatedSlug = watchTitle
    ? watchTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
    : '{slug}';
  const fallbackCanonical = `https://yourdomain.com/blog/${generatedSlug}`;
  const fallbackOgImage = watchCoverImage || 'Cover Image (Not uploaded yet)';

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

      const uploadedUrl = data?.data?.url || data?.url;
      form.setValue('coverImage', uploadedUrl);
      toast.success('Cover image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!blog?.id) return;
    setIsSaving(true);

    try {
      const cleanUrl = (url?: string) =>
        url && url.trim() !== '' ? url : undefined;

      const payload = {
        ...values,
        categoryId:
          values.categoryId && values.categoryId !== 'NONE'
            ? values.categoryId
            : null,
        tags: values.tags
          ? values.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        metaKeywords: values.metaKeywords
          ? values.metaKeywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : [],
        coverImage: cleanUrl(values.coverImage),
        ogImage: cleanUrl(values.ogImage),
        canonicalUrl: cleanUrl(values.canonicalUrl),
      };

      await api.patch(`/blog/${blog.id}`, payload);

      toast.success('Blog post updated successfully!');
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      router.push('/dashboard/blogs');
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update blog post');
    } finally {
      setIsSaving(false);
    }
  }

  if (isBlogLoading) {
    return (
      <div className='flex h-[60vh] items-center justify-center animate-pulse text-muted-foreground'>
        Loading blog post data...
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className='text-destructive font-medium p-4 bg-destructive/10 border border-destructive/20 rounded-lg'>
        Failed to load blog post.
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
              Edit Blog Post
            </h1>
            <p className='text-sm text-muted-foreground'>
              Update the content and metadata of your article.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue='basic' className='w-full block'>
            <TabsList className='grid w-full grid-cols-3 h-12 items-center bg-muted p-1 rounded-lg mb-6'>
              <TabsTrigger value='basic' className='h-full'>
                Main Content
              </TabsTrigger>
              <TabsTrigger value='settings' className='h-full'>
                Settings & Cover
              </TabsTrigger>
              <TabsTrigger value='seo' className='h-full'>
                SEO & Meta
              </TabsTrigger>
            </TabsList>

            <TabsContent value='basic' className='space-y-6 outline-none'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardContent className='p-6 space-y-6'>
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blog Title *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='excerpt'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt / Summary</FormLabel>
                        <FormControl>
                          <Textarea className='h-20 resize-none' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='content'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blog Content *</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='settings' className='space-y-6 outline-none'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardContent className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <FormField
                    control={form.control}
                    name='categoryId'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select category'>
                                {
                                  categories.find(
                                    (cat) => cat.id === field.value,
                                  )?.name
                                }
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='NONE'>
                              None (No Category)
                            </SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    name='readingTimeMins'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated Reading Time (Minutes)</FormLabel>
                        <FormControl>
                          <Input type='number' min='0' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='tags'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Comma separated)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='col-span-1 md:col-span-2 space-y-3 pt-4 border-t border-border/50'>
                    <FormLabel>Cover Image</FormLabel>
                    <div className='flex items-center gap-4'>
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

                    {watchCoverImage && (
                      <div className='relative w-full max-w-md h-48 rounded-lg overflow-hidden border border-border mt-4 group'>
                        <img
                          src={watchCoverImage}
                          alt='Cover Preview'
                          className='w-full h-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={() => form.setValue('coverImage', '')}
                          className='absolute top-2 right-2 p-1.5 bg-destructive rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity'
                        >
                          <X className='w-4 h-4' />
                        </button>
                      </div>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name='featured'
                    render={({ field }) => (
                      <FormItem className='flex flex-row items-center justify-between rounded-lg border border-border/50 p-4 bg-background/50 col-span-1 md:col-span-2'>
                        <div className='space-y-0.5'>
                          <FormLabel>Featured Blog Post</FormLabel>
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

            <TabsContent value='seo' className='space-y-6 outline-none'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardContent className='p-6 space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
                            <Input {...field} />
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
              className='bg-primary min-w-37.5'
            >
              {isSaving ? (
                'Updating...'
              ) : (
                <>
                  <Save className='w-4 h-4 mr-2' /> Update Blog Post
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
