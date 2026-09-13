/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, FolderTree, ShieldAlert } from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { Category, CategoryType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

const CATEGORY_TYPES: CategoryType[] = ['TECH', 'PROJECT', 'BLOG'];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'ALL' | CategoryType>('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<CategoryType[]>([
    'PROJECT',
  ]);
  const [order, setOrder] = useState(0);

  // Fetch Categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories', activeTab],
    queryFn: async () => {
      const param = activeTab === 'ALL' ? undefined : activeTab;
      const res = await api.get('/categories', {
        params: { type: param, limit: 100 },
      });
      return res.data?.data?.data || res.data?.data || res.data || [];
    },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSelectedTypes(['PROJECT']);
    setOrder(0);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedTypes(cat.types || []);
    setOrder(cat.order || 0);
    setIsModalOpen(true);
  };

  const handleTypeToggle = (type: CategoryType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) {
        toast.error('At least one type must be selected');
        return;
      }
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name is required');
    if (selectedTypes.length === 0)
      return toast.error('Select at least one type');

    setIsSubmitting(true);
    const payload = {
      name: name.trim(),
      types: selectedTypes,
      order: Number(order) || 0,
    };

    try {
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, payload);
        toast.success('Category updated successfully!');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to save category';
      toast.error(typeof msg === 'string' ? msg : msg[0] || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);

    try {
      await api.delete(`/categories/${categoryToDelete.id}`);
      toast.success('Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryToDelete(null);
    } catch (error: any) {
      // Backend 409 conflict handles if Category is used by a Skill
      const status = error.response?.status;
      const msg = error.response?.data?.message;

      if (status === 409) {
        toast.error(
          'Cannot delete: This category is currently referenced by a Skill.',
        );
      } else {
        toast.error(msg || 'Failed to delete category');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Categories
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage taxomony categories shared across Projects, Technologies,
            Skills, and Blogs.
          </p>
        </div>
        <Button onClick={openCreateModal} className='shrink-0 gap-2'>
          <Plus className='w-4 h-4' /> Add Category
        </Button>
      </div>

      {/* Tabs Filter */}
      <div className='flex items-center gap-2 border-b border-border pb-3 overflow-x-auto'>
        {(['ALL', 'TECH', 'PROJECT', 'BLOG'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            size='sm'
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <FolderTree className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>
            No categories found.
          </p>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className='backdrop-blur-sm border-border/50 bg-card/40'
            >
              <CardContent className='p-5 space-y-3'>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <h3 className='font-semibold text-foreground text-lg'>
                      {cat.name}
                    </h3>
                    <p className='text-xs text-muted-foreground'>
                      slug: {cat.slug}
                    </p>
                  </div>
                  <Badge variant='outline' className='text-xs'>
                    Order: {cat.order}
                  </Badge>
                </div>

                <div className='flex flex-wrap gap-1.5 pt-1'>
                  {cat.types?.map((t) => (
                    <Badge
                      key={t}
                      className='text-[10px] uppercase bg-primary/10 text-primary border-primary/20'
                    >
                      {t}
                    </Badge>
                  ))}
                </div>

                <div className='flex items-center justify-end gap-2 pt-3 border-t border-border/40'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => openEditModal(cat)}
                  >
                    <Edit2 className='w-3.5 h-3.5 mr-1' /> Edit
                  </Button>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setCategoryToDelete(cat)}
                    className='text-destructive hover:bg-destructive/10'
                  >
                    <Trash2 className='w-3.5 h-3.5 mr-1' /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Category Name</Label>
              <Input
                id='name'
                placeholder='e.g. Fullstack, Frontend, Cloud'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label>Applies To (Select Multiple Types)</Label>
              <div className='flex flex-wrap gap-4 pt-1'>
                {CATEGORY_TYPES.map((type) => (
                  <div key={type} className='flex items-center space-x-2'>
                    <Checkbox
                      id={`type-${type}`}
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => handleTypeToggle(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className='text-sm font-medium leading-none cursor-pointer'
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='order'>Sort Order</Label>
              <Input
                id='order'
                type='number'
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
              />
            </div>

            <DialogFooter className='pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting
                  ? 'Saving...'
                  : editingCategory
                    ? 'Update'
                    : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-destructive'>
              <ShieldAlert className='w-5 h-5' /> Delete Category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold text-foreground'>
                &quot;{categoryToDelete?.name}&quot;
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
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
