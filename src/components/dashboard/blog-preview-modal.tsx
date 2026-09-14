/* eslint-disable @next/next/no-img-element */
'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  ImageIcon,
  CalendarDays,
  User,
  Tag,
  Clock,
  BookOpen,
} from 'lucide-react';

import { Blog } from '@/app/(dashboard)/dashboard/blogs/columns';

interface BlogPreviewModalProps {
  blog: Blog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlogPreviewModal({
  blog,
  open,
  onOpenChange,
}: BlogPreviewModalProps) {
  if (!blog) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const categoryName =
    typeof blog.category === 'object' ? blog.category?.name : blog.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='w-[95vw] sm:max-w-3xl lg:max-w-5xl p-0 overflow-hidden bg-background border-border/50 shadow-2xl'
        aria-describedby={undefined}
      >
        <div className='max-h-[85vh] overflow-y-auto w-full'>
          {/* Cover Image Header */}
          <div className='relative w-full h-62.5 sm:h-87.5 bg-muted'>
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-muted-foreground/50'>
                <ImageIcon className='w-16 h-16 sm:w-20 sm:h-20' />
              </div>
            )}

            <div className='absolute top-4 left-4 flex flex-wrap gap-2 z-10'>
              <Badge
                variant={blog.status === 'PUBLISHED' ? 'default' : 'secondary'}
                className={
                  blog.status === 'PUBLISHED'
                    ? 'bg-success text-white hover:bg-success/80 shadow-md'
                    : 'shadow-md'
                }
              >
                {blog.status}
              </Badge>
              {blog.featured && (
                <Badge className='bg-amber-500 text-white hover:bg-amber-600 shadow-md'>
                  Featured
                </Badge>
              )}
            </div>

            <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-24'>
              <DialogTitle className='text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 leading-tight'>
                {blog.title}
              </DialogTitle>
              <div className='flex flex-wrap items-center gap-4 text-white/80 text-sm'>
                <span className='flex items-center gap-1.5'>
                  <Eye className='w-4 h-4' /> {blog.viewCount || 0} Views
                </span>
                {categoryName && (
                  <span className='flex items-center gap-1.5 border-l border-white/30 pl-4'>
                    <Tag className='w-4 h-4' /> {categoryName}
                  </span>
                )}
                {blog.readingTimeMins && (
                  <span className='flex items-center gap-1.5 border-l border-white/30 pl-4'>
                    <Clock className='w-4 h-4' /> {blog.readingTimeMins} min
                    read
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body Content Grid */}
          <div className='p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
            {/* Left Side (Excerpt & Content) */}
            <div className='lg:col-span-2 space-y-6 sm:space-y-8'>
              {blog.excerpt && (
                <div className='text-base sm:text-lg font-medium text-foreground/90 border-l-4 border-primary pl-4 py-1 leading-relaxed bg-muted/20 rounded-r-md'>
                  {blog.excerpt}
                </div>
              )}

              {blog.content && (
                <div className='space-y-3'>
                  <h3 className='text-lg sm:text-xl font-semibold flex items-center gap-2 border-b border-border/50 pb-2'>
                    <BookOpen className='w-5 h-5 text-primary' /> Content
                  </h3>
                  <div
                    className='prose prose-sm sm:prose-base dark:prose-invert max-w-none text-foreground/90 leading-relaxed overflow-hidden'
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                </div>
              )}
            </div>

            {/* Right Side (Sidebar Info) */}
            <div className='space-y-6'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base font-semibold'>
                    Article Info
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {blog.author && (
                    <div className='flex items-start gap-3 text-sm'>
                      <User className='w-4 h-4 mt-0.5 text-muted-foreground shrink-0' />
                      <div>
                        <p className='text-muted-foreground font-medium mb-1'>
                          Author
                        </p>
                        <p className='text-foreground leading-tight font-medium'>
                          {blog.author?.name || 'Admin'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className='flex items-start gap-3 text-sm'>
                    <CalendarDays className='w-4 h-4 mt-0.5 text-muted-foreground shrink-0' />
                    <div>
                      <p className='text-muted-foreground font-medium mb-1'>
                        Published Date
                      </p>
                      <p className='text-foreground leading-tight'>
                        {formatDate(blog.publishedAt || blog.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {blog.tags && blog.tags.length > 0 && (
                <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base font-semibold'>
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2'>
                      {blog.tags.map((tag: string, idx: number) => (
                        <Badge
                          key={idx}
                          variant='secondary'
                          className='bg-primary/10 text-primary hover:bg-primary/20'
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
