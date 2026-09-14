'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useBlogs } from '@/lib/hooks/use-blogs';
import { useCategories } from '@/lib/hooks/use-categories';
import { DataTable } from '@/components/dashboard/data-table';
import { getColumns } from './columns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BlogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch BLOG categories for filter dropdown
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories('BLOG');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);

    const timeoutId = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const { data, isLoading, isError } = useBlogs({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    sortBy,
    sortOrder: sortOrder as 'asc' | 'desc',
    page,
    limit,
  });

  // Safe data extraction for both direct array and meta wrapped formats
  const blogs = Array.isArray(data) ? data : data?.data || [];
  const meta = data?.meta || {
    total: blogs.length,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const columns = getColumns(page, limit);

  return (
    <div className='space-y-6 sm:space-y-8 pb-10'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Blog Posts
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your articles, categories, and SEO settings.
          </p>
        </div>
        <Link href='/dashboard/blogs/create' className='w-full sm:w-auto'>
          <Button className='w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md'>
            <Plus className='w-4 h-4 mr-2' />
            Add Blog Post
          </Button>
        </Link>
      </div>

      {/* Filters & Sorting Bar */}
      <div className='flex flex-col md:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-sm p-4 rounded-xl border border-border/50 shadow-sm'>
        {/* Search */}
        <div className='relative w-full md:max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search blog posts...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/50 w-full'
          />
        </div>

        {/* Filters */}
        <div className='flex flex-wrap md:flex-nowrap w-full md:w-auto items-center gap-3'>
          <div className='flex items-center gap-2 w-full md:w-auto'>
            <SlidersHorizontal className='w-4 h-4 text-muted-foreground hidden sm:block' />

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='w-full md:w-37.5 bg-background/50'>
                <SelectValue
                  placeholder={isLoadingCategories ? 'Loading...' : 'Category'}
                >
                  {categoryFilter === 'ALL'
                    ? 'All Categories'
                    : categories.find((c) => c.id === categoryFilter)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='w-full md:w-32.5 bg-background/50'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All Status</SelectItem>
                <SelectItem value='PUBLISHED'>Published</SelectItem>
                <SelectItem value='DRAFT'>Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(val) => {
              const [newSortBy, newSortOrder] = val.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-full md:w-40 bg-background/50'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='createdAt-desc'>Newest First</SelectItem>
              <SelectItem value='createdAt-asc'>Oldest First</SelectItem>
              <SelectItem value='viewCount-desc'>Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className='flex items-center justify-center h-64 text-muted-foreground animate-pulse bg-card/20 rounded-xl border border-border/30'>
          Loading blogs...
        </div>
      ) : isError ? (
        <div className='text-destructive font-medium p-4 border border-destructive/20 rounded-lg bg-destructive/10'>
          Failed to load blog posts. Please check if your backend server is
          running.
        </div>
      ) : (
        <DataTable columns={columns} data={blogs} />
      )}

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className='flex items-center justify-between border-t border-border/50 pt-6 mt-4'>
          <p className='text-sm text-muted-foreground hidden sm:block'>
            Showing {(page - 1) * limit + 1} to{' '}
            {Math.min(page * limit, meta.total)} of {meta.total} entries
          </p>
          <div className='flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className='h-4 w-4 mr-1' /> Previous
            </Button>
            <div className='text-sm font-medium px-4'>
              Page {page} of {meta.totalPages}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages || isLoading}
            >
              Next <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
