import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/axios-instance';
import { Category, CategoryType } from '@/types';

export const categoryKeys = {
  all: ['categories'] as const,
  list: (type?: CategoryType) => [...categoryKeys.all, 'list', type] as const,
};

// Category fetcher hook
export function useCategories(type?: CategoryType) {
  return useQuery<Category[]>({
    queryKey: categoryKeys.list(type),
    queryFn: async () => {
      const res = await api.get('/categories', {
        params: { type, limit: 100 },
      });
      return res.data?.data?.data || res.data?.data || res.data || [];
    },
  });
}
