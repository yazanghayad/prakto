import { queryOptions } from '@tanstack/react-query';
import { getLiaNotes, getLiaNote } from './service';

export const liaNotesKeys = {
  all: ['lia-notes'] as const,
  list: (userId: string) => [...liaNotesKeys.all, 'list', userId] as const,
  detail: (id: string) => [...liaNotesKeys.all, 'detail', id] as const
};

export const liaNotesListOptions = (userId: string) =>
  queryOptions({
    queryKey: liaNotesKeys.list(userId),
    queryFn: () => getLiaNotes(userId),
    enabled: !!userId
  });

export const liaNotesDetailOptions = (id: string) =>
  queryOptions({
    queryKey: liaNotesKeys.detail(id),
    queryFn: () => getLiaNote(id),
    enabled: !!id
  });
