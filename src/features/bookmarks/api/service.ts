import { apiUrl } from '@/lib/api-client';
import type { BookmarksResponse, BookmarkCheckResponse, ToggleBookmarkResponse } from './types';

/**
 * Get all bookmarks for a student (enriched with internship data).
 */
export async function getBookmarks(studentId: string): Promise<BookmarksResponse> {
  const res = await fetch(apiUrl(`/api/bookmarks?studentId=${encodeURIComponent(studentId)}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta sparade praktikplatser.');
  }
  return res.json();
}

/**
 * Check if a specific internship is bookmarked.
 */
export async function checkBookmark(
  studentId: string,
  internshipId: string
): Promise<BookmarkCheckResponse> {
  const res = await fetch(
    apiUrl(
      `/api/bookmarks?studentId=${encodeURIComponent(studentId)}&internshipId=${encodeURIComponent(internshipId)}`
    )
  );
  if (!res.ok) {
    return { isBookmarked: false, bookmark: null };
  }
  return res.json();
}

/**
 * Toggle bookmark — creates if not exists, deletes if exists.
 */
export async function toggleBookmark(internshipId: string): Promise<ToggleBookmarkResponse> {
  const res = await fetch(apiUrl('/api/bookmarks'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ internshipId })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte spara praktikplats.');
  }
  return res.json();
}
