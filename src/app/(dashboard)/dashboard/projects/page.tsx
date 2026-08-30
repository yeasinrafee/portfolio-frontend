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
import { useProjects } from '@/lib/hooks/use-projects';
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

export default function ProjectsPage() {
  // Filter and Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const limit = 20; // Enforced 20 items per page

  // Simple debounce for search input to prevent excessive API calls
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to page 1 on new search

    const timeoutId = setTimeout(() => {
      setDebouncedSearch(e.target.value);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  // Fetch data using the custom hook with all filters
  const { data, isLoading, isError } = useProjects({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  const projects = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  // Generate columns with current pagination state for serial number calculation
  const columns = getColumns(page, limit);

  return (
    <div className='space-y-6 sm:space-y-8 pb-10'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight text-foreground'>
            Projects
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage your portfolio projects and filters.
          </p>
        </div>
        <Button
          asChild
          className='w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md'
        >
          <Link href='/dashboard/projects/create'>
            <span className='flex justify-center items-center'>
              <Plus className='w-4 h-4 mr-2' />
              Add Project
            </span>
          </Link>
        </Button>
      </div>

      {/* Filters & Sorting Bar */}
      <div className='flex flex-col md:flex-row gap-4 items-center justify-between bg-card/40 backdrop-blur-sm p-4 rounded-xl border border-border/50 shadow-sm'>
        {/* Search */}
        <div className='relative w-full md:max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search projects...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/50 w-full'
          />
        </div>

        {/* Status and Sort Filters */}
        <div className='flex w-full md:w-auto items-center gap-3'>
          <div className='flex items-center gap-2 w-full md:w-auto'>
            <SlidersHorizontal className='w-4 h-4 text-muted-foreground hidden sm:block' />
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className='w-full md:w-[140px] bg-background/50'>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All Status</SelectItem>
                <SelectItem value='PUBLISHED'>Published</SelectItem>
                <SelectItem value='DRAFT'>Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(val) => {
              const [newSortBy, newSortOrder] = val.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
              setPage(1);
            }}
          >
            <SelectTrigger className='w-full md:w-[160px] bg-background/50'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='createdAt-desc'>Newest First</SelectItem>
              <SelectItem value='createdAt-asc'>Oldest First</SelectItem>
              <SelectItem value='viewCount-desc'>Most Viewed</SelectItem>
              <SelectItem value='order-asc'>Custom Order (1-9)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className='flex items-center justify-center h-64 text-muted-foreground animate-pulse bg-card/20 rounded-xl border border-border/30'>
          Loading projects...
        </div>
      ) : isError ? (
        <div className='text-destructive font-medium p-4 border border-destructive/20 rounded-lg bg-destructive/10'>
          Failed to load projects. Please try again.
        </div>
      ) : (
        <DataTable columns={columns} data={projects} />
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
