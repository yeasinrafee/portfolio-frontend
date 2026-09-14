/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios-instance';

export const blogKeys = {
  all: ['blogs'] as const,
  lists: () => [...blogKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) =>
    [...blogKeys.lists(), filters] as const,
  details: () => [...blogKeys.all, 'detail'] as const,
  detail: (slug: string) => [...blogKeys.details(), slug] as const,
};

export interface BlogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useBlogs(params: BlogQueryParams = {}) {
  return useQuery({
    queryKey: blogKeys.list(params),
    queryFn: async () => {
      try {
        const response = await api.get('/blog', { params });
        return (
          response.data?.data ||
          response.data || {
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
          }
        );
      } catch (error: any) {
        if (error.response?.status === 404) {
          return {
            data: [],
            meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
          };
        }
        throw error;
      }
    },
  });
}

export function useBlog(slug: string) {
  return useQuery({
    queryKey: blogKeys.detail(slug),
    queryFn: async () => {
      const { data } = await api.get(`/blog/${slug}`);
      return data?.data || data;
    },
    enabled: Boolean(slug),
  });
}
