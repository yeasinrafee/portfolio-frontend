'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Eye,
  ImageIcon,
  ExternalLink,
  Code,
  CalendarDays,
  User,
  Tag,
  LayoutGrid,
} from 'lucide-react';

import { Project } from '@/app/(dashboard)/dashboard/projects/columns';

interface ProjectPreviewModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectPreviewModal({
  project,
  open,
  onOpenChange,
}: ProjectPreviewModalProps) {
  if (!project) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='w-[95vw] sm:max-w-3xl lg:max-w-5xl p-0 overflow-hidden bg-background border-border/50 shadow-2xl'
        aria-describedby={undefined}
      >
        <div className='max-h-[85vh] overflow-y-auto w-full'>
          {/* Cover Image Header */}
          <div className='relative w-full h-[250px] sm:h-[350px] bg-muted'>
            {project.images?.length > 0 ? (
              <img
                src={project.images[0].url}
                alt={project.title}
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-muted-foreground/50'>
                <ImageIcon className='w-16 h-16 sm:w-20 sm:h-20' />
              </div>
            )}

            <div className='absolute top-4 left-4 flex flex-wrap gap-2 z-10'>
              <Badge
                variant={
                  project.status === 'PUBLISHED' ? 'default' : 'secondary'
                }
                className={
                  project.status === 'PUBLISHED'
                    ? 'bg-success text-white hover:bg-success/80 shadow-md'
                    : 'shadow-md'
                }
              >
                {project.status}
              </Badge>
              {project.featured && (
                <Badge className='bg-amber-500 text-white hover:bg-amber-600 shadow-md'>
                  Featured
                </Badge>
              )}
            </div>

            <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-6 pt-24'>
              <DialogTitle className='text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 leading-tight'>
                {project.title}
              </DialogTitle>
              <div className='flex flex-wrap items-center gap-4 text-white/80 text-sm'>
                <span className='flex items-center gap-1.5'>
                  <Eye className='w-4 h-4' /> {project.viewCount} Views
                </span>
                {project.category && (
                  <span className='flex items-center gap-1.5 border-l border-white/30 pl-4'>
                    <Tag className='w-4 h-4' /> {project.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body Content Grid */}
          <div className='p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
            {/* Left Side (Description & Gallery) */}
            <div className='lg:col-span-2 space-y-6 sm:space-y-8'>
              {project.shortSummary && (
                <div className='text-base sm:text-lg font-medium text-foreground/90 border-l-4 border-primary pl-4 py-1 leading-relaxed'>
                  {project.shortSummary}
                </div>
              )}

              {project.description && (
                <div className='space-y-3'>
                  <h3 className='text-lg sm:text-xl font-semibold flex items-center gap-2'>
                    <LayoutGrid className='w-5 h-5 text-primary' /> About
                    Project
                  </h3>
                  <div className='text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base'>
                    {project.description}
                  </div>
                </div>
              )}

              {project.images?.length > 1 && (
                <div className='space-y-4 pt-4 border-t border-border/50'>
                  <h3 className='text-base sm:text-lg font-semibold flex items-center gap-2'>
                    <ImageIcon className='w-5 h-5 text-primary' /> Gallery
                  </h3>
                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4'>
                    {project.images.slice(1).map((img, idx) => (
                      <div
                        key={idx}
                        className='aspect-video rounded-lg overflow-hidden bg-muted border border-border/50 shadow-sm'
                      >
                        <img
                          src={img.url}
                          alt={img.alt || `Gallery image ${idx + 2}`}
                          className='w-full h-full object-cover hover:scale-105 transition-transform duration-500'
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side (Details Sidebar) */}
            <div className='space-y-6'>
              <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base font-semibold'>
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-start gap-3 text-sm'>
                    <User className='w-4 h-4 mt-0.5 text-muted-foreground shrink-0' />
                    <div>
                      <p className='text-muted-foreground font-medium mb-1'>
                        Client
                      </p>
                      <p className='text-foreground leading-tight'>
                        {project.clientName || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className='flex items-start gap-3 text-sm'>
                    <CalendarDays className='w-4 h-4 mt-0.5 text-muted-foreground shrink-0' />
                    <div>
                      <p className='text-muted-foreground font-medium mb-1'>
                        Timeline
                      </p>
                      <p className='text-foreground leading-tight'>
                        {formatDate(project.startDate)}{' '}
                        <br className='hidden sm:block lg:hidden' /> -{' '}
                        {project.endDate
                          ? formatDate(project.endDate)
                          : 'Present'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {project.technologies && project.technologies.length > 0 && (
                <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base font-semibold'>
                      Technologies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='flex flex-wrap gap-2'>
                      {project.technologies.map((tech) => (
                        <Badge
                          key={tech.id}
                          variant='secondary'
                          className='bg-primary/10 text-primary hover:bg-primary/20'
                        >
                          {tech.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(project.liveUrl || project.repoUrl) && (
                <div className='flex flex-col gap-3 pt-2'>
                  {project.liveUrl && (
                    <Button
                      asChild
                      className='w-full shadow-md bg-primary hover:bg-primary/90 h-11'
                    >
                      <a
                        href={project.liveUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center justify-center'
                      >
                        <ExternalLink className='w-4 h-4 mr-2' /> Visit Live
                        Site
                      </a>
                    </Button>
                  )}
                  {project.repoUrl && (
                    <Button
                      asChild
                      variant='outline'
                      className='w-full shadow-sm h-11'
                    >
                      <a
                        href={project.repoUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='flex items-center justify-center'
                      >
                        <Code className='w-4 h-4 mr-2' /> Source Code
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
