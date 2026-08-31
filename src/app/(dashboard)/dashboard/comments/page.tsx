'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MessageSquare,
  Trash2,
  Clock,
  User as UserIcon,
  Search,
  CheckCircle2,
  XCircle,
  FolderGit2,
  FileText,
  ShieldAlert,
} from 'lucide-react';

import { api } from '@/lib/api/axios-instance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useAuthStore } from '@/lib/stores/auth-store';

type CommentUser = {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
};

type CommentProject = {
  id?: string;
  title?: string;
  slug?: string;
};

type CommentBlogPost = {
  id?: string;
  title?: string;
  slug?: string;
};

type CommentItem = {
  id: string;
  content: string;
  isApproved: boolean;
  user?: CommentUser;
  project?: CommentProject;
  blogPost?: CommentBlogPost;
  createdAt: string;
  updatedAt: string;
};

export default function CommentsPage() {
  const queryClient = useQueryClient();
  const isReady = useAuthStore((s) => s.isReady); // টোকেন রেডি স্ট্যাটাস

  const [commentToDelete, setCommentToDelete] = useState<CommentItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'approved' | 'hidden'
  >('all');

  // Robust Fetcher: Gets Projects and Blogs first, then queries comments for each
  // const fetchAllComments = async () => {
  //   try {
  //     let projects: any[] = [];
  //     let blogs: any[] = [];

  //     try {
  //       const projRes = await api.get('/projects');
  //       projects =
  //         projRes.data?.data?.data || projRes.data?.data || projRes.data || [];
  //     } catch (e) {
  //       console.warn('Could not fetch projects');
  //     }

  //     try {
  //       const blogRes = await api
  //         .get('/blogs')
  //         .catch(() => api.get('/blog-posts'));
  //       blogs =
  //         blogRes.data?.data?.data || blogRes.data?.data || blogRes.data || [];
  //     } catch (e) {
  //       console.warn('Could not fetch blogs');
  //     }

  //     const commentPromises: Promise<any>[] = [];

  //     // Fetch comments for each project
  //     if (Array.isArray(projects)) {
  //       projects.forEach((proj) => {
  //         if (proj?.id) {
  //           commentPromises.push(
  //             api
  //               .get(`/comments?projectId=${proj.id}`)
  //               .then((res) => {
  //                 const list =
  //                   res.data?.data?.data || res.data?.data || res.data || [];
  //                 return (Array.isArray(list) ? list : []).map((c: any) => ({
  //                   ...c,
  //                   project: proj,
  //                 }));
  //               })
  //               .catch(() => []),
  //           );
  //         }
  //       });
  //     }

  //     // Fetch comments for each blog
  //     if (Array.isArray(blogs)) {
  //       blogs.forEach((blog) => {
  //         if (blog?.id) {
  //           commentPromises.push(
  //             api
  //               .get(`/comments?blogPostId=${blog.id}`)
  //               .then((res) => {
  //                 const list =
  //                   res.data?.data?.data || res.data?.data || res.data || [];
  //                 return (Array.isArray(list) ? list : []).map((c: any) => ({
  //                   ...c,
  //                   blogPost: blog,
  //                 }));
  //               })
  //               .catch(() => []),
  //           );
  //         }
  //       });
  //     }

  //     const results = await Promise.all(commentPromises);
  //     const allComments = results.flat();

  //     // Deduplicate by ID just in case
  //     const unique = new Map<string, CommentItem>();
  //     allComments.forEach((c) => {
  //       if (c && c.id) unique.set(c.id, c);
  //     });

  //     return Array.from(unique.values()).sort(
  //       (a, b) =>
  //         new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  //     );
  //   } catch (error) {
  //     console.error('Error fetching comments:', error);
  //     return [];
  //   }
  // };

  // Robust Fetcher: Fetches all comments via Admin Endpoint
  const fetchAllComments = async () => {
    try {
      const res = await api.get('/comments/admin?limit=100');
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error('Error fetching admin comments:', error);
      return [];
    }
  };

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments'],
    queryFn: fetchAllComments,
    enabled: isReady, // টোকেন রেডি না হওয়া পর্যন্ত কোয়েরি ফায়ার হবে না
    refetchOnWindowFocus: false, // ট্যাব সুইচ করলে অযথা রিফেচ হবে না
    staleTime: 60_000, // ১ মিনিট ক্যাশ ধরে রাখবে
  });

  // Filter Logic
  const filteredComments = comments.filter((item) => {
    const userName = item.user?.name || '';
    const userEmail = item.user?.email || '';
    const projectTitle = item.project?.title || '';
    const blogTitle = item.blogPost?.title || '';
    const content = item.content || '';

    const matchesSearch =
      content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blogTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'approved') return matchesSearch && item.isApproved;
    if (filterStatus === 'hidden') return matchesSearch && !item.isApproved;
    return matchesSearch;
  });

  // Toggle Moderate Status (Optimistic Update - No Refetch)
  const toggleApproval = async (item: CommentItem) => {
    const newStatus = !item.isApproved;

    // 1. Update the UI cache immediately so it jumps to the right tab without backend refresh
    queryClient.setQueryData(
      ['comments'],
      (oldData: CommentItem[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((c) =>
          c.id === item.id ? { ...c, isApproved: newStatus } : c,
        );
      },
    );

    try {
      // 2. Call backend moderate API
      await api.patch(`/comments/${item.id}/moderate`, {
        isApproved: newStatus,
      });
      toast.success(
        newStatus
          ? 'Comment Approved & Visible!'
          : 'Comment Hidden to Pending!',
      );
    } catch (error: any) {
      // 3. Rollback UI if backend fails
      queryClient.setQueryData(
        ['comments'],
        (oldData: CommentItem[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((c) =>
            c.id === item.id ? { ...c, isApproved: item.isApproved } : c,
          );
        },
      );
      toast.error('Failed to update comment status');
    }
  };

  // Delete Comment (Optimistic Update - No Refetch)
  const confirmDelete = async () => {
    if (!commentToDelete) return;
    setIsDeleting(true);

    const idToDelete = commentToDelete.id;

    // Optimistically remove from UI
    queryClient.setQueryData(
      ['comments'],
      (oldData: CommentItem[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((c) => c.id !== idToDelete);
      },
    );

    try {
      await api.delete(`/comments/${idToDelete}`);
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      // Rollback on fail (re-fetch to be safe)
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      toast.error('Failed to delete comment');
    } finally {
      setIsDeleting(false);
      setCommentToDelete(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-8 max-w-5xl mx-auto pb-10'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Comments Moderation
          </h1>
          <p className='text-muted-foreground mt-1'>
            Review all comments, approve them for public view, or hide them.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className='flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div className='relative w-full sm:w-72'>
          <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search comments...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Tabs - flex-wrap দেওয়া হয়েছে বাটন জাম্পিং বন্ধ করতে */}
        <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilterStatus('all')}
          >
            All ({comments.length})
          </Button>
          <Button
            variant={filterStatus === 'approved' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilterStatus('approved')}
          >
            Approved ({comments.filter((c) => c.isApproved).length})
          </Button>
          <Button
            variant={filterStatus === 'hidden' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilterStatus('hidden')}
            className={
              filterStatus === 'hidden'
                ? ''
                : 'text-amber-500 hover:text-amber-600'
            }
          >
            Hidden / Pending ({comments.filter((c) => !c.isApproved).length})
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className='flex items-center justify-center h-48 text-muted-foreground animate-pulse'>
          Loading comments...
        </div>
      ) : filteredComments.length === 0 ? (
        <div className='text-center py-12 border border-border/50 rounded-xl bg-card/20'>
          <MessageSquare className='w-12 h-12 mx-auto text-muted-foreground/50 mb-3' />
          <p className='text-muted-foreground font-medium'>
            No comments found in this tab.
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredComments.map((item) => (
            <Card
              key={item.id}
              className={`backdrop-blur-sm border-border/50 transition-all ${
                !item.isApproved
                  ? 'bg-amber-500/10 border-l-4 border-l-amber-500'
                  : 'bg-card/40'
              }`}
            >
              <CardContent className='p-5 space-y-4'>
                {/* User & Context */}
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40'>
                  <div className='flex items-center gap-3'>
                    <div className='w-9 h-9 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0'>
                      {item.user?.avatar ? (
                        <img
                          src={item.user.avatar}
                          alt={item.user.name || 'User'}
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <UserIcon className='w-4 h-4 text-muted-foreground' />
                      )}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h4 className='font-semibold text-sm text-foreground'>
                          {item.user?.name || 'Anonymous User'}
                        </h4>
                        {item.user?.email && (
                          <span className='text-xs text-muted-foreground'>
                            ({item.user.email})
                          </span>
                        )}
                      </div>
                      <span className='text-xs text-muted-foreground flex items-center gap-1 mt-0.5'>
                        <Clock className='w-3 h-3' />{' '}
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className='flex items-center gap-2 flex-wrap'>
                    {item.project?.title && (
                      <Badge
                        variant='outline'
                        className='flex items-center gap-1.5 text-xs bg-muted/40'
                      >
                        <FolderGit2 className='w-3.5 h-3.5 text-primary' />
                        <span className='truncate max-w-[160px]'>
                          {item.project.title}
                        </span>
                      </Badge>
                    )}
                    {item.blogPost?.title && (
                      <Badge
                        variant='outline'
                        className='flex items-center gap-1.5 text-xs bg-muted/40'
                      >
                        <FileText className='w-3.5 h-3.5 text-primary' />
                        <span className='truncate max-w-[160px]'>
                          {item.blogPost.title}
                        </span>
                      </Badge>
                    )}
                    {item.isApproved ? (
                      <Badge className='bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[11px]'>
                        Approved / Live
                      </Badge>
                    ) : (
                      <Badge className='bg-amber-500/20 text-amber-600 dark:text-amber-500 border-amber-500/30 text-[11px] font-semibold'>
                        Hidden / Pending
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className='text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap'>
                  {item.content}
                </p>

                {/* Actions */}
                <div className='flex items-center justify-between pt-2 border-t border-border/30'>
                  <span className='text-xs text-muted-foreground italic'>
                    {item.isApproved
                      ? 'This comment is visible to everyone.'
                      : 'This comment is hidden from public view.'}
                  </span>

                  <div className='flex items-center gap-2'>
                    {item.isApproved ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => toggleApproval(item)}
                        className='text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                      >
                        <XCircle className='w-4 h-4 mr-1.5' /> Hide Comment
                      </Button>
                    ) : (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => toggleApproval(item)}
                        className='bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      >
                        <CheckCircle2 className='w-4 h-4 mr-1.5' /> Approve
                        Comment
                      </Button>
                    )}

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setCommentToDelete(item)}
                      className='text-destructive hover:text-destructive hover:bg-destructive/10'
                    >
                      <Trash2 className='w-4 h-4 mr-1.5' /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!commentToDelete}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-destructive'>
              <ShieldAlert className='w-5 h-5' /> Delete Comment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove the
              comment from
              <span className='font-semibold text-foreground'>
                {' '}
                "{commentToDelete?.user?.name || 'this user'}"
              </span>
              .
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
