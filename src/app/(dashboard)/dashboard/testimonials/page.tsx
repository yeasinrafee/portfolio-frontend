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
  MessageSquareQuote,
  Star,
  Upload,
  X,
  FolderCode,
} from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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

// Schema mapped to Prisma Testimonial model
const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  company: z.string().optional(),
  photo: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  message: z.string().min(1, 'Message is required'),
  rating: z.coerce.number().min(1).max(5).optional(),
  order: z.coerce.number().default(0),
});

type Testimonial = {
  id: string;
  name: string;
  designation?: string;
  company?: string;
  photo?: string;
  message: string;
  rating?: number;
  order: number;
};

export default function TestimonialsPage() {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [testimonialToDelete, setTestimonialToDelete] =
    useState<Testimonial | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all testimonials
  const { data: response, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data } = await api.get('/testimonials');
      return data?.data || data;
    },
  });

  const testimonials = response || [];

  const form = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: '',
      designation: '',
      company: '',
      photo: '',
      message: '',
      rating: 5,
      order: 0,
    },
  });

  const editForm = useForm<z.infer<typeof testimonialSchema>>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: '',
      designation: '',
      company: '',
      photo: '',
      message: '',
      rating: 5,
      order: 0,
    },
  });

  // Photo Upload Helper
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

      if (isEdit) {
        editForm.setValue('photo', data.url);
      } else {
        form.setValue('photo', data.url);
      }
      toast.success('Photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const cleanField = (val?: string) => (val && val.trim() !== '' ? val : null);

  // Handle Create Testimonial
  async function onCreateSubmit(values: z.infer<typeof testimonialSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        designation: cleanField(values.designation),
        company: cleanField(values.company),
        photo: cleanField(values.photo),
      };
      await api.post('/testimonials', payload);
      toast.success('Testimonial added successfully!');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      form.reset();
      setIsAddOpen(false);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to add testimonial');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (item: Testimonial) => {
    setSelectedTestimonial(item);
    editForm.reset({
      name: item.name || '',
      designation: item.designation || '',
      company: item.company || '',
      photo: item.photo || '',
      message: item.message || '',
      rating: item.rating || 5,
      order: item.order || 0,
    });
    setIsEditOpen(true);
  };

  // Handle Update Testimonial
  async function onEditSubmit(values: z.infer<typeof testimonialSchema>) {
    if (!selectedTestimonial) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        designation: cleanField(values.designation),
        company: cleanField(values.company),
        photo: cleanField(values.photo),
      };
      await api.patch(`/testimonials/${selectedTestimonial.id}`, payload);
      toast.success('Testimonial updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      setIsEditOpen(false);
      setSelectedTestimonial(null);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update testimonial');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Testimonial
  const confirmDelete = async () => {
    if (!testimonialToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/testimonials/${testimonialToDelete.id}`);
      toast.success('Testimonial deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to delete testimonial',
      );
    } finally {
      setIsDeleting(false);
      setTestimonialToDelete(null);
    }
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header & Add Button */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Testimonials
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage feedback and recommendations from clients and colleagues.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className='bg-primary hover:bg-primary/90 shadow-md'>
              <Plus className='w-4 h-4 mr-2' /> Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Add New Testimonial</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreateSubmit)}
                className='space-y-4 pt-2'
              >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. John Doe' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='designation'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Designation</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. CEO' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='company'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. TechCorp' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='rating'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating (1-5)</FormLabel>
                        <FormControl>
                          <Input type='number' min='1' max='5' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Photo Upload */}
                <div className='space-y-2'>
                  <FormLabel>Photo</FormLabel>
                  <div className='flex items-center gap-4'>
                    {form.watch('photo') ? (
                      <div className='relative w-12 h-12 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center'>
                        <img
                          src={form.watch('photo')}
                          alt='Photo preview'
                          className='w-full h-full object-cover'
                        />
                        <button
                          type='button'
                          onClick={() => form.setValue('photo', '')}
                          className='absolute top-0 right-0 bg-destructive text-white p-0.5 rounded-full text-xs'
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
                        'Uploading...'
                      ) : (
                        <>
                          <Upload className='w-4 h-4 mr-2' /> Upload Photo
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
                  name='message'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea
                          className='h-24'
                          placeholder='Write the testimonial message...'
                          {...field}
                        />
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
                    {isSubmitting ? 'Saving...' : 'Save Testimonial'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Testimonials List */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading testimonials...
        </div>
      ) : testimonials.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <MessageSquareQuote className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>
            No testimonials found.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {testimonials.map((item: Testimonial) => (
            <Card
              key={item.id}
              className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm hover:border-primary/50 transition-colors flex flex-col justify-between'
            >
              <CardContent className='p-6 space-y-4'>
                <div className='flex items-center justify-between'>
                  {item.rating ? (
                    <div className='flex items-center gap-1 text-amber-500'>
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className='w-4 h-4 fill-current' />
                      ))}
                    </div>
                  ) : (
                    <div />
                  )}
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <FolderCode className='w-3.5 h-3.5' /> Order: {item.order}
                  </span>
                </div>

                <p className='text-sm text-muted-foreground italic leading-relaxed'>
                  "{item.message}"
                </p>

                <div className='flex items-center justify-between pt-4 border-t border-border/50'>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-muted border border-border/50 overflow-hidden flex items-center justify-center shrink-0'>
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <span className='text-sm font-semibold'>
                          {item.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className='font-semibold text-sm'>{item.name}</h4>
                      <p className='text-xs text-muted-foreground'>
                        {item.designation}
                        {item.company ? ` at ${item.company}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpenEdit(item)}
                      className='h-8 w-8 text-muted-foreground hover:text-foreground'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setTestimonialToDelete(item)}
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
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className='space-y-4 pt-2'
            >
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                <FormField
                  control={editForm.control}
                  name='designation'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={editForm.control}
                  name='company'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name='rating'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5)</FormLabel>
                      <FormControl>
                        <Input type='number' min='1' max='5' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Photo Upload */}
              <div className='space-y-2'>
                <FormLabel>Photo</FormLabel>
                <div className='flex items-center gap-4'>
                  {editForm.watch('photo') ? (
                    <div className='relative w-12 h-12 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center'>
                      <img
                        src={editForm.watch('photo')}
                        alt='Photo preview'
                        className='w-full h-full object-cover'
                      />
                      <button
                        type='button'
                        onClick={() => editForm.setValue('photo', '')}
                        className='absolute top-0 right-0 bg-destructive text-white p-0.5 rounded-full text-xs'
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
                      'Uploading...'
                    ) : (
                      <>
                        <Upload className='w-4 h-4 mr-2' /> Upload Photo
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
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea className='h-24' {...field} />
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
                  {isSubmitting ? 'Updating...' : 'Update Testimonial'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!testimonialToDelete}
        onOpenChange={(open) => !open && setTestimonialToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              testimonial from
              <span className='font-semibold text-foreground'>
                {' '}
                "{testimonialToDelete?.name}"{' '}
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
