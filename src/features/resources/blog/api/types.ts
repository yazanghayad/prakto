import type { Models } from 'appwrite';

export type BlogStatus = 'draft' | 'published';

export type BlogCategory = 'tips' | 'karriar' | 'intervju' | 'cv' | 'brev' | 'inspiration';

export interface BlogPost extends Models.Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  coverImageUrl: string;
  authorId: string;
  status: BlogStatus;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  totalPages: number;
}

export interface BlogPostResponse {
  post: BlogPost;
}

export interface CreateBlogPayload {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  category?: BlogCategory;
  coverImageUrl?: string;
  status?: BlogStatus;
}
