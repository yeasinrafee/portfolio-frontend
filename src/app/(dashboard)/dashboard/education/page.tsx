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
  GraduationCap,
  Calendar,
  MapPin,
  BookOpen,
} from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

// Schema matching Prisma Education Model exactly
const eduSchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().optional(),
  location: z.string().optional(), // Added location field
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  order: z.coerce.number().default(0),
});

type Education = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  order: number;
};

export default function EducationPage() {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEdu, setSelectedEdu] = useState<Education | null>(null);

  const [eduToDelete, setEduToDelete] = useState<Education | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all education records
  const { data: response, isLoading } = useQuery({
    queryKey: ['education'],
    queryFn: async () => {
      const { data } = await api.get('/education');
      return data?.data || data;
    },
  });

  const educationList = response || [];

  const form = useForm<z.infer<typeof eduSchema>>({
    resolver: zodResolver(eduSchema),
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      order: 0,
    },
  });

  const editForm = useForm<z.infer<typeof eduSchema>>({
    resolver: zodResolver(eduSchema),
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      order: 0,
    },
  });

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  // Handle Create Education
  async function onCreateSubmit(values: z.infer<typeof eduSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate:
          values.isCurrent || !values.endDate
            ? null
            : new Date(values.endDate).toISOString(),
      };
      await api.post('/education', payload);
      toast.success('Education record added successfully!');
      queryClient.invalidateQueries({ queryKey: ['education'] });
      form.reset();
      setIsAddOpen(false);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to add education record');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (edu: Education) => {
    setSelectedEdu(edu);
    editForm.reset({
      institution: edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.fieldOfStudy || '',
      location: edu.location || '',
      startDate: formatDateForInput(edu.startDate),
      endDate: formatDateForInput(edu.endDate),
      isCurrent: edu.isCurrent || false,
      description: edu.description || '',
      order: edu.order || 0,
    });
    setIsEditOpen(true);
  };

  // Handle Update Education
  async function onEditSubmit(values: z.infer<typeof eduSchema>) {
    if (!selectedEdu) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        startDate: new Date(values.startDate).toISOString(),
        endDate:
          values.isCurrent || !values.endDate
            ? null
            : new Date(values.endDate).toISOString(),
      };
      await api.patch(`/education/${selectedEdu.id}`, payload);
      toast.success('Education record updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['education'] });
      setIsEditOpen(false);
      setSelectedEdu(null);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update education record');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Education
  const confirmDelete = async () => {
    if (!eduToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/education/${eduToDelete.id}`);
      toast.success('Education record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['education'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
      setEduToDelete(null);
    }
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header & Add Button */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Education
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your academic qualifications and degrees.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className='bg-primary hover:bg-primary/90 shadow-md'>
              <Plus className='w-4 h-4 mr-2' /> Add Education
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Add Education Record</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreateSubmit)}
                className='space-y-4 pt-2'
              >
                <FormField
                  control={form.control}
                  name='institution'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution / University *</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Dhaka University' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='degree'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree *</FormLabel>
                        <FormControl>
                          <Input placeholder='e.g. B.Sc in CSE' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='fieldOfStudy'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Field of Study</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Computer Science'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='location'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g. Dhaka, Bangladesh'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='startDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
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
                          <Input
                            type='date'
                            disabled={form.watch('isCurrent')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='isCurrent'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/20'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-sm'>
                          Currently Studying Here
                        </FormLabel>
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
                      <FormLabel>Description / Key Achievements</FormLabel>
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
                    {isSubmitting ? 'Saving...' : 'Save Education'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Education List */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading education records...
        </div>
      ) : educationList.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <GraduationCap className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>
            No education records found.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {educationList.map((edu: Education) => (
            <Card
              key={edu.id}
              className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm hover:border-primary/50 transition-colors'
            >
              <CardContent className='p-6'>
                <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                  <div className='flex items-start gap-4'>
                    <div className='p-3 bg-primary/10 text-primary rounded-xl shrink-0'>
                      <GraduationCap className='w-6 h-6' />
                    </div>

                    <div className='space-y-1'>
                      <div className='flex items-center gap-3'>
                        <h3 className='font-bold text-xl'>{edu.degree}</h3>
                        {edu.isCurrent && (
                          <Badge className='bg-primary/20 text-primary border-primary/30'>
                            Present
                          </Badge>
                        )}
                      </div>
                      <p className='font-medium text-foreground/90'>
                        {edu.institution}
                      </p>

                      <div className='flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1'>
                        {edu.fieldOfStudy && (
                          <span className='flex items-center gap-1.5'>
                            <BookOpen className='w-3.5 h-3.5' />{' '}
                            {edu.fieldOfStudy}
                          </span>
                        )}
                        {edu.location && (
                          <span className='flex items-center gap-1.5'>
                            <MapPin className='w-3.5 h-3.5' /> {edu.location}
                          </span>
                        )}
                        <span className='flex items-center gap-1.5'>
                          <Calendar className='w-3.5 h-3.5' />
                          {formatDateDisplay(edu.startDate)} -{' '}
                          {edu.isCurrent
                            ? 'Present'
                            : formatDateDisplay(edu.endDate)}
                        </span>
                      </div>

                      {edu.description && (
                        <p className='text-sm text-muted-foreground/90 pt-3 leading-relaxed whitespace-pre-wrap'>
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-2 self-end sm:self-start'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpenEdit(edu)}
                      className='h-8 w-8 text-muted-foreground hover:text-foreground'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setEduToDelete(edu)}
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
            <DialogTitle>Edit Education Record</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className='space-y-4 pt-2'
            >
              <FormField
                control={editForm.control}
                name='institution'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution / University *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={editForm.control}
                  name='degree'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name='fieldOfStudy'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field of Study</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name='location'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={editForm.control}
                  name='startDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name='endDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          disabled={editForm.watch('isCurrent')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name='isCurrent'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/20'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-sm'>
                        Currently Studying Here
                      </FormLabel>
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
                    <FormLabel>Description / Key Achievements</FormLabel>
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
                  {isSubmitting ? 'Updating...' : 'Update Record'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!eduToDelete}
        onOpenChange={(open) => !open && setEduToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              education record for
              <span className='font-semibold text-foreground'>
                {' '}
                "{eduToDelete?.degree} at {eduToDelete?.institution}"{' '}
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
