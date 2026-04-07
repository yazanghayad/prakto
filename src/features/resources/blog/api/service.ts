import { apiUrl } from '@/lib/api-client';
import type { BlogListResponse, BlogPostResponse, CreateBlogPayload } from './types';

export async function getBlogPosts(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<BlogListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.category) query.set('category', params.category);

  const res = await fetch(apiUrl(`/api/blog?${query.toString()}`));
  if (!res.ok) throw new Error('Kunde inte hämta blogginlägg.');
  return res.json();
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostResponse> {
  const res = await fetch(apiUrl(`/api/blog?slug=${encodeURIComponent(slug)}`));
  if (!res.ok) throw new Error('Kunde inte hämta blogginlägget.');
  return res.json();
}

export async function getBlogPostById(id: string): Promise<BlogPostResponse> {
  const res = await fetch(apiUrl(`/api/blog?id=${encodeURIComponent(id)}`));
  if (!res.ok) throw new Error('Kunde inte hämta blogginlägget.');
  return res.json();
}

export async function createOrUpdateBlogPost(data: CreateBlogPayload): Promise<BlogPostResponse> {
  const res = await fetch(apiUrl('/api/blog'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara blogginlägg.');
  }
  return res.json();
}

export async function deleteBlogPost(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/blog?id=${encodeURIComponent(id)}`), {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort blogginlägg.');
  }
}
