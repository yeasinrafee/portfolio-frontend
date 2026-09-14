/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2, Eye, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api/axios-instance';
import { blogKeys } from '@/lib/hooks/use-blogs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { BlogPreviewModal } from '@/components/dashboard/blog-preview-modal';

export type Blog = {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  categoryId?: string;
  category?: { id: string; name: string; slug?: string } | string;
  viewCount?: number;
  featured?: boolean;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  readingTimeMins?: number;
  publishedAt?: string;
  createdAt?: string;
  tags?: string[];
  author?: { name: string; email?: string };
};

const ActionCell = ({ blog }: { blog: Blog }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/blog/${blog.id}`);
      toast.success('Blog post deleted successfully');
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to delete blog post',
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className='flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal className='h-4 w-4 text-foreground/80' />
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            className='cursor-pointer py-2'
            onClick={() => setShowPreviewDialog(true)}
          >
            <Eye className='mr-2 h-4 w-4' /> Preview
          </DropdownMenuItem>

          <DropdownMenuItem
            className='cursor-pointer py-2'
            onClick={() => router.push(`/dashboard/blogs/edit/${blog.slug}`)}
          >
            <Edit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 py-2'
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              blog post
              <span className='font-semibold text-foreground'>
                {' '}
                &quot;{blog.title}&quot;{' '}
              </span>
              and remove its data.
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

      <BlogPreviewModal
        blog={blog}
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
      />
    </>
  );
};

export const getColumns = (
  currentPage: number,
  limit: number,
): ColumnDef<Blog>[] => [
  {
    id: 'serial',
    header: '#',
    cell: ({ row }) => {
      const serialNumber = (currentPage - 1) * limit + row.index + 1;
      return (
        <span className='text-muted-foreground font-medium'>
          {serialNumber}
        </span>
      );
    },
  },
  {
    id: 'coverImage',
    header: 'Cover',
    cell: ({ row }) => {
      const blog = row.original;
      return (
        <div className='h-10 w-12 rounded overflow-hidden bg-muted flex items-center justify-center border border-border/50 shadow-sm'>
          {blog.coverImage ? (
            <img
              src={blog.coverImage}
              alt={blog.title}
              className='h-full w-full object-cover'
            />
          ) : (
            <ImageIcon className='h-4 w-4 text-muted-foreground/50' />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div className='font-medium text-foreground line-clamp-1 max-w-55'>
        {row.getValue('title')}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <Badge
          variant={status === 'PUBLISHED' ? 'default' : 'secondary'}
          className={
            status === 'PUBLISHED'
              ? 'bg-success text-success-foreground hover:bg-success/80 shadow-sm'
              : 'shadow-sm'
          }
        >
          {status}
        </Badge>
      );
    },
  },
  {
    id: 'category',
    header: 'Category',
    cell: ({ row }) => {
      const cat = row.original.category;
      return (
        <div className='text-muted-foreground'>
          {typeof cat === 'object' ? cat?.name : cat || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'viewCount',
    header: 'Views',
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5 text-muted-foreground'>
        <Eye className='w-4 h-4' />
        <span className='font-medium'>{row.getValue('viewCount') || 0}</span>
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionCell blog={row.original} />,
  },
];
