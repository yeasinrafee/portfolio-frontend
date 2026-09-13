/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Edit,
  Cpu,
  FolderCode,
  Upload,
  X,
  Loader2,
} from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { useCategories } from '@/lib/hooks/use-categories';
import { CategoryBrief } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const techSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  icon: z.string().optional().or(z.literal('')),
  order: z.coerce.number().default(0),
});

type Technology = {
  id: string;
  name: string;
  slug: string;
  categoryId?: string;
  category?: CategoryBrief;
  description?: string;
  icon?: string;
  order: number;
};

export default function TechnologiesPage() {
  const queryClient = useQueryClient();

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Delete dialog states
  const [techToDelete, setTechToDelete] = useState<Technology | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch TECH categories for dropdown[cite: 2]
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories('TECH');

  // Fetch all technologies[cite: 1]
  const { data: response, isLoading } = useQuery({
    queryKey: ['technologies'],
    queryFn: async () => {
      const { data } = await api.get('/technologies');
      return data?.data?.data || data?.data || data;
    },
  });

  const technologies = response || [];

  const form = useForm<z.infer<typeof techSchema>>({
    resolver: zodResolver(techSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      icon: '',
      order: 0,
    },
  });

  const editForm = useForm<z.infer<typeof techSchema>>({
    resolver: zodResolver(techSchema),
    defaultValues: {
      name: '',
      categoryId: '',
      description: '',
      icon: '',
      order: 0,
    },
  });

  // Handle Automatic Image Upload for Icon
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit: boolean = false,
  ) => {
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
      if (isEdit) {
        editForm.setValue('icon', uploadedUrl);
      } else {
        form.setValue('icon', uploadedUrl);
      }
      toast.success('Icon uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload icon');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Create[cite: 1]
  async function onCreateSubmit(values: z.infer<typeof techSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        categoryId:
          values.categoryId && values.categoryId !== 'NONE'
            ? values.categoryId
            : undefined,
        icon:
          values.icon && values.icon.trim() !== '' ? values.icon : undefined,
        description:
          values.description && values.description.trim() !== ''
            ? values.description
            : undefined,
      };

      await api.post('/technologies', payload);
      toast.success('Technology created successfully!');
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
      form.reset();
      setIsAddOpen(false);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to create technology');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Edit Modal and reset form
  const handleOpenEdit = (tech: Technology) => {
    setSelectedTech(tech);
    editForm.reset({
      name: tech.name || '',
      categoryId: tech.categoryId || tech.category?.id || 'NONE',
      description: tech.description || '',
      icon: tech.icon || '',
      order: tech.order || 0,
    });
    setIsEditOpen(true);
  };

  // Handle Update[cite: 1]
  async function onEditSubmit(values: z.infer<typeof techSchema>) {
    if (!selectedTech) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        categoryId:
          values.categoryId && values.categoryId !== 'NONE'
            ? values.categoryId
            : null,
        icon: values.icon && values.icon.trim() !== '' ? values.icon : null,
        description:
          values.description && values.description.trim() !== ''
            ? values.description
            : null,
      };

      await api.patch(`/technologies/${selectedTech.id}`, payload);
      toast.success('Technology updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
      setIsEditOpen(false);
      setSelectedTech(null);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update technology');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete with Alert Dialog[cite: 1]
  const confirmDelete = async () => {
    if (!techToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/technologies/${techToDelete.id}`);
      toast.success('Technology deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['technologies'] });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to delete technology',
      );
    } finally {
      setIsDeleting(false);
      setTechToDelete(null);
    }
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header & Add Button */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Technologies
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage technologies used across your portfolio projects.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className='bg-primary hover:bg-primary/90 shadow-md'>
              <Plus className='w-4 h-4 mr-2' /> Add Technology
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Add New Technology</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreateSubmit)}
                className='space-y-4 pt-2'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Next.js' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category Dropdown (Optional) */}
                <FormField
                  control={form.control}
                  name='categoryId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingCategories
                                  ? 'Loading categories...'
                                  : 'Select category'
                              }
                            >
                              {
                                categories.find((cat) => cat.id === field.value)
                                  ?.name
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

                {/* Icon Upload (File Input) */}
                <div className='space-y-2'>
                  <FormLabel>Icon Image (Optional)</FormLabel>
                  <div className='flex items-center gap-4'>
                    {form.watch('icon') ? (
                      <div className='relative w-12 h-12 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0'>
                        <img
                          src={form.watch('icon')}
                          alt='Icon preview'
                          className='w-8 h-8 object-contain'
                        />
                        <button
                          type='button'
                          onClick={() => form.setValue('icon', '')}
                          className='absolute top-0.5 right-0.5 bg-destructive text-white p-0.5 rounded-full text-xs'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </div>
                    ) : null}
                    <Button
                      type='button'
                      variant='secondary'
                      size='sm'
                      disabled={isUploading}
                      className='relative cursor-pointer'
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className='w-4 h-4 mr-2 animate-spin' />{' '}
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className='w-4 h-4 mr-2' /> Upload Icon
                        </>
                      )}
                      <input
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleImageUpload(e, false)}
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                        disabled={isUploading}
                      />
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name='order'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type='number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea className='h-20' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end gap-3 pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Technology'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Technology List Grid */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading technologies...
        </div>
      ) : technologies.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <Cpu className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>
            No technologies found.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {technologies.map((tech: Technology) => (
            <Card
              key={tech.id}
              className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between'
            >
              <CardContent className='p-5 flex flex-col justify-between h-full space-y-4'>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <div className='flex items-center gap-2.5 min-w-0'>
                      {tech.icon && (
                        <img
                          src={tech.icon}
                          alt={tech.name}
                          className='w-5 h-5 object-contain shrink-0'
                        />
                      )}
                      <h3 className='font-semibold text-lg truncate'>
                        {tech.name}
                      </h3>
                    </div>
                    {tech.category?.name && (
                      <Badge
                        variant='secondary'
                        className='text-[10px] shrink-0'
                      >
                        {tech.category.name}
                      </Badge>
                    )}
                  </div>
                  {tech.description && (
                    <p className='text-sm text-muted-foreground line-clamp-2'>
                      {tech.description}
                    </p>
                  )}
                </div>

                <div className='flex items-center justify-between pt-4 border-t border-border/50'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <FolderCode className='w-3.5 h-3.5' /> Order: {tech.order}
                  </span>

                  <div className='flex items-center gap-1'>
                    {/* Edit Button */}
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpenEdit(tech)}
                      className='h-8 w-8 text-muted-foreground hover:text-foreground'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>

                    {/* Delete Button */}
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setTechToDelete(tech)}
                      className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Edit Technology</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className='space-y-4 pt-2'
            >
              <FormField
                control={editForm.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category Dropdown (Edit) */}
              <FormField
                control={editForm.control}
                name='categoryId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select category'>
                            {
                              categories.find((cat) => cat.id === field.value)
                                ?.name
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='NONE'>None (No Category)</SelectItem>
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

              {/* Icon Upload (Edit Form) */}
              <div className='space-y-2'>
                <FormLabel>Icon Image (Optional)</FormLabel>
                <div className='flex items-center gap-4'>
                  {editForm.watch('icon') ? (
                    <div className='relative w-12 h-12 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0'>
                      <img
                        src={editForm.watch('icon')}
                        alt='Icon preview'
                        className='w-8 h-8 object-contain'
                      />
                      <button
                        type='button'
                        onClick={() => editForm.setValue('icon', '')}
                        className='absolute top-0.5 right-0.5 bg-destructive text-white p-0.5 rounded-full text-xs'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ) : null}
                  <Button
                    type='button'
                    variant='secondary'
                    size='sm'
                    disabled={isUploading}
                    className='relative cursor-pointer'
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />{' '}
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className='w-4 h-4 mr-2' /> Upload Icon
                      </>
                    )}
                    <input
                      type='file'
                      accept='image/*'
                      onChange={(e) => handleImageUpload(e, true)}
                      className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                      disabled={isUploading}
                    />
                  </Button>
                </div>
              </div>

              <FormField
                control={editForm.control}
                name='order'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type='number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className='h-20' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-3 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Technology'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modern Alert Dialog for Delete */}
      <AlertDialog
        open={!!techToDelete}
        onOpenChange={(open) => !open && setTechToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              technology
              <span className='font-semibold text-foreground'>
                {' '}
                &quot;{techToDelete?.name}&quot;{' '}
              </span>
              from your database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
