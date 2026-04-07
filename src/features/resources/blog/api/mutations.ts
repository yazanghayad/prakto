import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createOrUpdateBlogPost, deleteBlogPost } from './service';
import { blogKeys } from './queries';
import type { CreateBlogPayload } from './types';

export const saveBlogPostMutation = mutationOptions({
  mutationFn: (data: CreateBlogPayload) => createOrUpdateBlogPost(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: blogKeys.all });
  }
});

export const deleteBlogPostMutation = mutationOptions({
  mutationFn: (id: string) => deleteBlogPost(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: blogKeys.all });
  }
});
