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
  Briefcase,
  Calendar,
  MapPin,
  Globe,
  FolderCode,
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

// Schema mapped to backend field: 'role' instead of 'position'
const expSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  role: z
    .string()
    .min(1, 'Role is required')
    .max(100, 'Role must be 100 characters or less'),
  location: z.string().optional(),
  companyUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  order: z.coerce.number().default(0),
});

type Experience = {
  id: string;
  company: string;
  role: string;
  location?: string;
  companyUrl?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  order: number;
};

export default function ExperiencePage() {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);

  const [expToDelete, setExpToDelete] = useState<Experience | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all experience records
  const { data: response, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: async () => {
      const { data } = await api.get('/experience');
      return data?.data || data;
    },
  });

  const experienceList = response || [];

  const form = useForm<z.infer<typeof expSchema>>({
    resolver: zodResolver(expSchema),
    defaultValues: {
      company: '',
      role: '',
      location: '',
      companyUrl: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: '',
      order: 0,
    },
  });

  const editForm = useForm<z.infer<typeof expSchema>>({
    resolver: zodResolver(expSchema),
    defaultValues: {
      company: '',
      role: '',
      location: '',
      companyUrl: '',
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

  const cleanUrl = (url?: string) => (url && url.trim() !== '' ? url : null);

  // Handle Create Experience
  async function onCreateSubmit(values: z.infer<typeof expSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        companyUrl: cleanUrl(values.companyUrl),
        startDate: new Date(values.startDate).toISOString(),
        endDate:
          values.isCurrent || !values.endDate
            ? null
            : new Date(values.endDate).toISOString(),
      };
      await api.post('/experience', payload);
      toast.success('Experience record added successfully!');
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      form.reset();
      setIsAddOpen(false);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to add experience record');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (exp: Experience) => {
    setSelectedExp(exp);
    editForm.reset({
      company: exp.company || '',
      role: exp.role || '',
      location: exp.location || '',
      companyUrl: exp.companyUrl || '',
      startDate: formatDateForInput(exp.startDate),
      endDate: formatDateForInput(exp.endDate),
      isCurrent: exp.isCurrent || false,
      description: exp.description || '',
      order: exp.order || 0,
    });
    setIsEditOpen(true);
  };

  // Handle Update Experience
  async function onEditSubmit(values: z.infer<typeof expSchema>) {
    if (!selectedExp) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        companyUrl: cleanUrl(values.companyUrl),
        startDate: new Date(values.startDate).toISOString(),
        endDate:
          values.isCurrent || !values.endDate
            ? null
            : new Date(values.endDate).toISOString(),
      };
      await api.patch(`/experience/${selectedExp.id}`, payload);
      toast.success('Experience record updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
      setIsEditOpen(false);
      setSelectedExp(null);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update experience record');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Experience
  const confirmDelete = async () => {
    if (!expToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/experience/${expToDelete.id}`);
      toast.success('Experience record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['experiences'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    } finally {
      setIsDeleting(false);
      setExpToDelete(null);
    }
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header & Add Button */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Work Experience
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your professional career history and job roles.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className='bg-primary hover:bg-primary/90 shadow-md'>
              <Plus className='w-4 h-4 mr-2' /> Add Experience
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>Add Work Experience</DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreateSubmit)}
                className='space-y-4 pt-2'
              >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='company'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Google / Ads Premiere'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='role'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role / Position *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g. Software Engineer'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                  <FormField
                    control={form.control}
                    name='companyUrl'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website (URL)</FormLabel>
                        <FormControl>
                          <Input placeholder='https://...' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          Currently Working Here
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
                      <FormLabel>Responsibilities & Achievements</FormLabel>
                      <FormControl>
                        <Textarea className='min-h-[100px]' {...field} />
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
                    {isSubmitting ? 'Saving...' : 'Save Experience'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Experience List */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading work experiences...
        </div>
      ) : experienceList.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <Briefcase className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>
            No experience records found.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {experienceList.map((exp: Experience) => (
            <Card
              key={exp.id}
              className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm hover:border-primary/50 transition-colors'
            >
              <CardContent className='p-6'>
                <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                  <div className='flex items-start gap-4'>
                    <div className='p-3 bg-primary/10 text-primary rounded-xl shrink-0'>
                      <Briefcase className='w-6 h-6' />
                    </div>

                    <div className='space-y-1'>
                      <div className='flex items-center gap-3'>
                        <h3 className='font-bold text-xl'>{exp.role}</h3>
                        {exp.isCurrent && (
                          <Badge className='bg-primary/20 text-primary border-primary/30'>
                            Present Role
                          </Badge>
                        )}
                      </div>

                      <div className='flex items-center gap-2 font-medium text-foreground/90'>
                        <span>{exp.company}</span>
                        {exp.companyUrl && (
                          <a
                            href={exp.companyUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary hover:underline'
                          >
                            <Globe className='w-3.5 h-3.5 inline' />
                          </a>
                        )}
                      </div>

                      <div className='flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1'>
                        {exp.location && (
                          <span className='flex items-center gap-1.5'>
                            <MapPin className='w-3.5 h-3.5' /> {exp.location}
                          </span>
                        )}
                        <span className='flex items-center gap-1.5'>
                          <Calendar className='w-3.5 h-3.5' />
                          {formatDateDisplay(exp.startDate)} -{' '}
                          {exp.isCurrent
                            ? 'Present'
                            : formatDateDisplay(exp.endDate)}
                        </span>
                        <span className='flex items-center gap-1.5 border-l border-border pl-3'>
                          <FolderCode className='w-3.5 h-3.5' /> Order:{' '}
                          {exp.order}
                        </span>
                      </div>

                      {exp.description && (
                        <p className='text-sm text-muted-foreground/90 pt-3 leading-relaxed whitespace-pre-wrap'>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-2 self-end sm:self-start'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpenEdit(exp)}
                      className='h-8 w-8 text-muted-foreground hover:text-foreground'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setExpToDelete(exp)}
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
            <DialogTitle>Edit Work Experience</DialogTitle>
          </DialogHeader>

          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className='space-y-4 pt-2'
            >
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FormField
                  control={editForm.control}
                  name='company'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name='role'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role / Position *</FormLabel>
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
                <FormField
                  control={editForm.control}
                  name='companyUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website (URL)</FormLabel>
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
                        Currently Working Here
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
                    <FormLabel>Responsibilities & Achievements</FormLabel>
                    <FormControl>
                      <Textarea className='min-h-[100px]' {...field} />
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
        open={!!expToDelete}
        onOpenChange={(open) => !open && setExpToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              experience record for
              <span className='font-semibold text-foreground'>
                {' '}
                "{expToDelete?.role} at {expToDelete?.company}"{' '}
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
