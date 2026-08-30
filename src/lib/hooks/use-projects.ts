/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios-instance';

export const projectKeys = {
  all: ['projects'] as const,
  list: (filters: Record<string, any>) =>
    [...projectKeys.all, 'list', filters] as const,
  detail: (slug: string) => [...projectKeys.all, 'detail', slug] as const,
};

export function useProjects(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: async () => {
      const { data } = await api.get('/projects', { params: filters });
      return data;
    },
  });
}
