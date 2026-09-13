import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios-instance';
import { Achievement, AchievementType } from '@/types';

export const achievementKeys = {
  all: ['achievements'] as const,
  list: (type?: AchievementType, featured?: boolean) =>
    [...achievementKeys.all, 'list', { type, featured }] as const,
};

// Achievement fetcher hook
export function useAchievements(type?: AchievementType, featured?: boolean) {
  return useQuery<Achievement[]>({
    queryKey: achievementKeys.list(type, featured),
    queryFn: async () => {
      const res = await api.get('/achievements', {
        params: { type, featured },
      });
      return res.data?.data?.data || res.data?.data || res.data || [];
    },
  });
}
