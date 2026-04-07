import { queryOptions } from '@tanstack/react-query';
import { getBlogPosts, getBlogPostBySlug } from './service';

export const blogKeys = {
  all: ['blog'] as const,
  list: (params?: { page?: number; category?: string }) =>
    [...blogKeys.all, 'list', params] as const,
  detail: (slug: string) => [...blogKeys.all, 'detail', slug] as const
};

export const blogListOptions = (params?: { page?: number; limit?: number; category?: string }) =>
  queryOptions({
    queryKey: blogKeys.list({ page: params?.page, category: params?.category }),
    queryFn: () => getBlogPosts(params)
  });

export const blogPostOptions = (slug: string) =>
  queryOptions({
    queryKey: blogKeys.detail(slug),
    queryFn: () => getBlogPostBySlug(slug),
    enabled: !!slug
  });
