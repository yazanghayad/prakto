import { queryOptions } from '@tanstack/react-query';
import { getBookmarks, checkBookmark } from './service';

// ─── Key Factories ─────────────────────────────────────────────

export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  list: (studentId: string) => [...bookmarkKeys.all, 'list', studentId] as const,
  check: (studentId: string, internshipId: string) =>
    [...bookmarkKeys.all, 'check', studentId, internshipId] as const
};

// ─── Query Options ─────────────────────────────────────────────

export const bookmarksQueryOptions = (studentId: string) =>
  queryOptions({
    queryKey: bookmarkKeys.list(studentId),
    queryFn: () => getBookmarks(studentId),
    enabled: !!studentId
  });

export const bookmarkCheckOptions = (studentId: string, internshipId: string) =>
  queryOptions({
    queryKey: bookmarkKeys.check(studentId, internshipId),
    queryFn: () => checkBookmark(studentId, internshipId),
    enabled: !!studentId && !!internshipId
  });
