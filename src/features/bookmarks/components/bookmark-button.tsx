'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useUser } from '@/hooks/use-auth';
import { bookmarkCheckOptions, bookmarkKeys } from '@/features/bookmarks/api/queries';
import { toggleBookmarkMutation } from '@/features/bookmarks/api/mutations';
import type { ToggleBookmarkResponse } from '@/features/bookmarks/api/types';
import { getQueryClient } from '@/lib/query-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BookmarkButtonProps {
  internshipId: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export function BookmarkButton({
  internshipId,
  variant = 'icon',
  className
}: Readonly<BookmarkButtonProps>) {
  const { profile } = useUser();
  const isStudent = profile?.role === 'student';
  const userId = profile?.userId ?? '';

  const { data } = useQuery({
    ...bookmarkCheckOptions(userId, internshipId),
    enabled: !!userId && isStudent
  });

  const mutation = useMutation({
    ...toggleBookmarkMutation,
    onSuccess: (result: ToggleBookmarkResponse) => {
      getQueryClient().invalidateQueries({ queryKey: bookmarkKeys.all });
      toast.success(
        result.isBookmarked ? 'Praktikplats sparad!' : 'Praktikplats borttagen från sparade.'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Kunde inte spara.');
    }
  });

  // Only show for students
  if (!isStudent) return null;

  const checkResult = data as { isBookmarked?: boolean } | undefined;
  const isBookmarked = checkResult?.isBookmarked ?? false;

  const handleToggle = () => {
    mutation.mutate(internshipId);
  };

  if (variant === 'full') {
    return (
      <Button
        type='button'
        variant={isBookmarked ? 'default' : 'outline'}
        size='sm'
        onClick={handleToggle}
        disabled={mutation.isPending}
        className={cn('gap-2', className)}
      >
        {mutation.isPending ? (
          <Icons.spinner className='h-4 w-4 animate-spin' />
        ) : (
          <Icons.bookmark className={cn('h-4 w-4', isBookmarked && 'fill-current')} />
        )}
        {isBookmarked ? 'Sparad' : 'Spara'}
      </Button>
    );
  }

  return (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className={cn('h-9 w-9', className)}
      onClick={handleToggle}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? (
        <Icons.spinner className='h-4.5 w-4.5 animate-spin' />
      ) : (
        <Icons.bookmark className={cn('h-4.5 w-4.5', isBookmarked && 'fill-current')} />
      )}
      <span className='sr-only'>{isBookmarked ? 'Ta bort sparad' : 'Spara'}</span>
    </Button>
  );
}
