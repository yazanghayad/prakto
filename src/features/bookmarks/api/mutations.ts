import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { toggleBookmark } from './service';
import { bookmarkKeys } from './queries';

export const toggleBookmarkMutation = mutationOptions({
  mutationFn: (internshipId: string) => toggleBookmark(internshipId),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: bookmarkKeys.all });
  }
});
