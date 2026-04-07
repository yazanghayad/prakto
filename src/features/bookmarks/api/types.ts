import type { Models } from 'appwrite';
import type { Internship } from '@/features/internships/api/types';

export interface Bookmark extends Models.Document {
  studentId: string;
  internshipId: string;
  createdAt: string;
  // Joined
  internship?: Internship | null;
}

export type BookmarksResponse = {
  total: number;
  bookmarks: Bookmark[];
};

export type BookmarkCheckResponse = {
  isBookmarked: boolean;
  bookmark: Bookmark | null;
};

export type ToggleBookmarkResponse = {
  action: 'added' | 'removed';
  isBookmarked: boolean;
  bookmark?: Bookmark;
};
