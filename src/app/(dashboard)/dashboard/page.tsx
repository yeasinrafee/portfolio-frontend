/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios-instance';
import Link from 'next/link';
import {
  FolderGit2,
  FileText,
  Eye,
  Mail,
  Users,
  TrendingUp,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardOverviewPage() {
  // Fetch dashboard overview data based on backend documentation
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/overview');
      return data; // Adjust if your backend wraps success responses in { data: ... }
    },
  });

  const dashboardData = response?.data || response;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !dashboardData) {
    return (
      <div className='flex flex-col items-center justify-center h-[60vh] space-y-4'>
        <p className='text-destructive font-medium bg-destructive/10 px-4 py-2 rounded-lg'>
          Failed to load dashboard statistics.
        </p>
        <Button variant='outline' onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const {
    counts,
    viewStats,
    topProjects,
    topBlogPosts,
    recentComments,
    recentMessages,
  } = dashboardData;

  // Formatting date for recent items
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-8 pb-10'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-foreground'>
          Dashboard Overview
        </h1>
        <p className='text-muted-foreground mt-1'>
          Welcome back! Here is what&apos;s happening with your portfolio today.
        </p>
      </div>

      {/* Top Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <MetricCard
          title='Total Projects'
          value={counts.totalProjects}
          subtitle={`${counts.publishedProjects} Published`}
          icon={<FolderGit2 className='w-5 h-5 text-blue-500' />}
          trend='primary'
        />
        <MetricCard
          title='Total Blog Posts'
          value={counts.totalBlogPosts}
          subtitle={`${counts.publishedBlogPosts} Published`}
          icon={<FileText className='w-5 h-5 text-emerald-500' />}
          trend='success'
        />
        <MetricCard
          title='Total Views'
          value={viewStats.totalProjectViews + viewStats.totalBlogViews}
          subtitle='Projects & Blogs Combined'
          icon={<Eye className='w-5 h-5 text-purple-500' />}
          trend='warning'
        />
        <MetricCard
          title='Messages'
          value={counts.totalMessages}
          subtitle={
            counts.unreadMessages > 0
              ? `${counts.unreadMessages} Unread messages`
              : 'All caught up!'
          }
          icon={<Mail className='w-5 h-5 text-rose-500' />}
          trend='destructive'
          alert={counts.unreadMessages > 0}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <SmallMetricCard
          title='Skills'
          value={counts.totalSkills}
          icon={<TrendingUp className='w-4 h-4' />}
        />
        <SmallMetricCard
          title='Technologies'
          value={counts.totalTechnologies}
          icon={<TrendingUp className='w-4 h-4' />}
        />
        <SmallMetricCard
          title='Testimonials'
          value={counts.totalTestimonials}
          icon={<Users className='w-4 h-4' />}
        />
        <SmallMetricCard
          title='Comments'
          value={counts.totalComments}
          icon={<MessageCircle className='w-4 h-4' />}
        />
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Top Projects */}
        <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <div>
              <CardTitle className='text-lg font-semibold'>
                Top Performing Projects
              </CardTitle>
              <CardDescription>
                Most viewed projects in your portfolio
              </CardDescription>
            </div>
            <Button
              variant='ghost'
              size='sm'
              asChild
              className='hidden sm:flex'
            >
              <Link href='/dashboard/projects'>
                View All <ArrowRight className='w-4 h-4 ml-2' />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {topProjects?.length > 0 ? (
              <div className='space-y-4 mt-4'>
                {topProjects.map((project: any, index: number) => (
                  <div
                    key={project.id}
                    className='flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm'>
                        {index + 1}
                      </div>
                      <div>
                        <p className='font-medium line-clamp-1'>
                          {project.title}
                        </p>
                        <p className='text-xs text-muted-foreground flex items-center gap-1 mt-0.5'>
                          <Eye className='w-3 h-3' /> {project.viewCount} views
                        </p>
                      </div>
                    </div>
                    <Button variant='ghost' size='icon' asChild>
                      <Link href={`/dashboard/projects/edit/${project.slug}`}>
                        <ArrowRight className='w-4 h-4' />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground mt-4 text-center py-6'>
                No projects found.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm'>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <div>
              <CardTitle className='text-lg font-semibold'>
                Recent Messages
              </CardTitle>
              <CardDescription>
                Latest inquiries from contact form
              </CardDescription>
            </div>
            <Button
              variant='ghost'
              size='sm'
              asChild
              className='hidden sm:flex'
            >
              <Link href='/dashboard/messages'>
                Inbox <ArrowRight className='w-4 h-4 ml-2' />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMessages?.length > 0 ? (
              <div className='space-y-4 mt-4'>
                {recentMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className='flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 gap-3'
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <p className='font-medium text-sm truncate'>
                          {msg.name}
                        </p>
                        {!msg.isRead && (
                          <Badge className='h-5 px-1.5 text-[10px] bg-primary'>
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground truncate'>
                        {msg.subject || 'No Subject'}
                      </p>
                    </div>
                    <div className='text-xs text-muted-foreground whitespace-nowrap'>
                      {formatDate(msg.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground mt-4 text-center py-6'>
                No new messages.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, subtitle, icon, alert = false }: any) {
  return (
    <Card className='bg-card/40 backdrop-blur-sm border-border/50 shadow-sm relative overflow-hidden group'>
      {alert && (
        <div className='absolute top-0 right-0 w-2 h-2 m-4 rounded-full bg-rose-500 animate-pulse' />
      )}
      <CardContent className='p-6'>
        <div className='flex items-center justify-between space-y-0 pb-4'>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <div className='p-2.5 bg-muted rounded-xl group-hover:scale-110 transition-transform duration-300'>
            {icon}
          </div>
        </div>
        <div className='space-y-1'>
          <h2 className='text-3xl font-bold tracking-tight'>
            {value?.toLocaleString() || 0}
          </h2>
          <p className='text-xs text-muted-foreground'>{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SmallMetricCard({ title, value, icon }: any) {
  return (
    <div className='flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/20 shadow-sm'>
      <div className='p-2 bg-muted rounded-lg text-muted-foreground'>
        {icon}
      </div>
      <div>
        <p className='text-xl font-bold leading-none mb-1'>{value || 0}</p>
        <p className='text-xs text-muted-foreground font-medium'>{title}</p>
      </div>
    </div>
  );
}

// Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className='space-y-8 pb-10'>
      <div className='space-y-2'>
        <Skeleton className='h-10 w-[250px]' />
        <Skeleton className='h-4 w-[400px]' />
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-[140px] w-full rounded-xl' />
        ))}
      </div>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className='h-[70px] w-full rounded-xl' />
        ))}
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        <Skeleton className='h-[400px] w-full rounded-xl' />
        <Skeleton className='h-[400px] w-full rounded-xl' />
      </div>
    </div>
  );
}
