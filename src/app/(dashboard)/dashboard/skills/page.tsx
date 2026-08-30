'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Award, FolderCode, Upload, X } from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const skillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().optional(),
  icon: z.string().optional().or(z.literal('')),
  order: z.coerce.number().default(0),
});

type Skill = {
  id: string;
  name: string;
  category?: string;
  icon?: string;
  order: number;
};

export default function SkillsPage() {
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all skills
  const { data: response, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data } = await api.get('/skills');
      return data?.data || data;
    },
  });

  const skills = response || [];

  const form = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', category: '', icon: '', order: 0 },
  });

  const editForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', category: '', icon: '', order: 0 },
  });

  // Image Upload Helper for Add Form
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
        editForm.setValue('icon', data.url);
      } else {
        form.setValue('icon', data.url);
      }
      toast.success('Icon uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload icon');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Create Skill
  async function onCreateSubmit(values: z.infer<typeof skillSchema>) {
    setIsSubmitting(true);
    try {
      const cleanValues = {
        ...values,
        icon: values.icon && values.icon.trim() !== '' ? values.icon : null,
      };
      await api.post('/skills', cleanValues);
      toast.success('Skill created successfully!');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      form.reset();
      setIsAddOpen(false);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to create skill');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (skill: Skill) => {
    setSelectedSkill(skill);
    editForm.reset({
      name: skill.name || '',
      category: skill.category || '',
      icon: skill.icon || '',
      order: skill.order || 0,
    });
    setIsEditOpen(true);
  };

  // Handle Update Skill
  async function onEditSubmit(values: z.infer<typeof skillSchema>) {
    if (!selectedSkill) return;
    setIsSubmitting(true);
    try {
      const cleanValues = {
        ...values,
        icon: values.icon && values.icon.trim() !== '' ? values.icon : null,
      };
      await api.patch(`/skills/${selectedSkill.id}`, cleanValues);
      toast.success('Skill updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      setIsEditOpen(false);
      setSelectedSkill(null);
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message[0]
        : error.response?.data?.message;
      toast.error(errorMsg || 'Failed to update skill');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Delete Skill
  const confirmDelete = async () => {
    if (!skillToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/skills/${skillToDelete.id}`);
      toast.success('Skill deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete skill');
    } finally {
      setIsDeleting(false);
      setSkillToDelete(null);
    }
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header & Add Button */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Skills
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your professional skills and technical stack.
          </p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className='bg-primary hover:bg-primary/90 shadow-md'>
              <Plus className='w-4 h-4 mr-2' /> Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Add New Skill</DialogTitle>
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
                      <FormLabel>Skill Name *</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. React.js' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder='e.g. Frontend' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload for Icon */}
                <div className='space-y-2'>
                  <FormLabel>Skill Icon (Image)</FormLabel>
                  <div className='flex items-center gap-4'>
                    {form.watch('icon') ? (
                      <div className='relative w-12 h-12 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center'>
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
                        'Uploading...'
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
                <div className='flex justify-end gap-3 pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Skill'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading skills...
        </div>
      ) : skills.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <Award className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>No skills found.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {skills.map((skill: Skill) => (
            <Card
              key={skill.id}
              className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm hover:border-primary/50 transition-colors'
            >
              <CardContent className='p-5 flex flex-col justify-between h-full space-y-4'>
                <div className='flex items-center gap-3'>
                  {skill.icon ? (
                    <div className='w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border/50 shrink-0'>
                      <img
                        src={skill.icon}
                        alt={skill.name}
                        className='w-6 h-6 object-contain'
                      />
                    </div>
                  ) : (
                    <div className='w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                      <Award className='w-5 h-5' />
                    </div>
                  )}
                  <div className='space-y-1 min-w-0 flex-1'>
                    <h3 className='font-semibold text-base truncate'>
                      {skill.name}
                    </h3>
                    {skill.category && (
                      <Badge variant='secondary' className='text-[10px]'>
                        {skill.category}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-between pt-3 border-t border-border/50'>
                  <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <FolderCode className='w-3.5 h-3.5' /> Order: {skill.order}
                  </span>

                  <div className='flex items-center gap-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => handleOpenEdit(skill)}
                      className='h-8 w-8 text-muted-foreground hover:text-foreground'
                    >
                      <Edit className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => setSkillToDelete(skill)}
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
            <DialogTitle>Edit Skill</DialogTitle>
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
                    <FormLabel>Skill Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload for Edit Form */}
              <div className='space-y-2'>
                <FormLabel>Skill Icon (Image)</FormLabel>
                <div className='flex items-center gap-4'>
                  {editForm.watch('icon') ? (
                    <div className='relative w-12 h-12 rounded-lg border border-border bg-muted overflow-hidden flex items-center justify-center'>
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
                      'Uploading...'
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
              <div className='flex justify-end gap-3 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Skill'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={!!skillToDelete}
        onOpenChange={(open) => !open && setSkillToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              skill
              <span className='font-semibold text-foreground'>
                {' '}
                "{skillToDelete?.name}"{' '}
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
