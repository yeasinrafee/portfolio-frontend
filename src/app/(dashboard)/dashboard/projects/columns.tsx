'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2, Eye, ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { api } from '@/lib/api/axios-instance';
import { projectKeys } from '@/lib/hooks/use-projects';
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

// নতুন তৈরি করা মোডালটি ইমপোর্ট করা হলো
import { ProjectPreviewModal } from '@/components/dashboard/project-preview-modal';

export type Project = {
  id: string;
  title: string;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  category?: string;
  viewCount: number;
  featured: boolean;
  shortSummary?: string;
  description?: string;
  clientName?: string;
  liveUrl?: string;
  repoUrl?: string;
  startDate?: string;
  endDate?: string;
  images: { url: string; alt?: string; order: number }[];
  technologies?: { id: string; name: string }[];
};

const ActionCell = ({ project }: { project: Project }) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      toast.success('Project deleted successfully');
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete project');
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
            onClick={() =>
              router.push(`/dashboard/projects/edit/${project.slug}`)
            }
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

      {/* Delete Alert */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project
              <span className='font-semibold text-foreground'>
                {' '}
                "{project.title}"{' '}
              </span>
              and remove its data from our servers.
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

      <ProjectPreviewModal
        project={project}
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
      />
    </>
  );
};

export const getColumns = (
  currentPage: number,
  limit: number,
): ColumnDef<Project>[] => [
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
    id: 'thumbnail',
    header: 'Image',
    cell: ({ row }) => {
      const project = row.original;
      const thumbnail =
        project.images?.length > 0 ? project.images[0].url : null;

      return (
        <div className='h-10 w-12 rounded overflow-hidden bg-muted flex items-center justify-center border border-border/50 shadow-sm'>
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={project.title}
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
      <div className='font-medium text-foreground line-clamp-1 max-w-[200px]'>
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
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <div className='text-muted-foreground'>
        {row.getValue('category') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'viewCount',
    header: 'Views',
    cell: ({ row }) => (
      <div className='flex items-center gap-1.5 text-muted-foreground'>
        <Eye className='w-4 h-4' />
        <span className='font-medium'>{row.getValue('viewCount')}</span>
      </div>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <ActionCell project={row.original} />,
  },
];
