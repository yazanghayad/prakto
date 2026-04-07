'use client';

import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { notificationsQueryOptions, notificationKeys } from '../api/queries';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../api/service';
import type { AppNotification } from '../api/service';

const MAX_VISIBLE = 5;

const formatDate = (date: string): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just nu';
  if (diffMins < 60) return `${diffMins} min sedan`;
  if (diffHours < 24) return `${diffHours} tim sedan`;
  if (diffDays < 7) return `${diffDays} dagar sedan`;

  return d.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
};

export function NotificationCenter() {
  const { isAuthenticated } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    ...notificationsQueryOptions({ limit: MAX_VISIBLE }),
    enabled: isAuthenticated
  });

  const notifications = data?.notifications ?? [];
  const count = data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    }
  });

  const handleClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif.$id);
    }
    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-8 w-8'>
          <Icons.notification className='h-4 w-4' />
          {count > 0 && (
            <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
              {count > 9 ? '9+' : count}
            </span>
          )}
          <span className='sr-only'>Notiser</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[calc(100vw-2rem)] p-0 sm:w-[380px]' sideOffset={8}>
        <div className='flex items-center justify-between px-4 py-3'>
          <Link href='/dashboard/notifications' className='group flex items-center gap-1'>
            <h4 className='text-sm font-semibold group-hover:underline'>Notiser</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
          </Link>
          <div className='flex items-center gap-2'>
            {count > 0 && (
              <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
                {count} nya
              </span>
            )}
            {count > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground h-auto px-2 py-1 text-xs'
                onClick={() => markAllReadMutation.mutate()}
              >
                Markera alla lästa
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className='h-[400px]'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>Inga notiser ännu</p>
            </div>
          ) : (
            <div className='flex flex-col gap-0.5 p-1.5'>
              {notifications.map((notif) => (
                <button
                  key={notif.$id}
                  onClick={() => handleClick(notif)}
                  className={`hover:bg-accent flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                    !notif.isRead ? 'bg-accent/50' : ''
                  }`}
                >
                  <div className='flex-1 space-y-0.5'>
                    <div className='flex items-center gap-2'>
                      {!notif.isRead && <span className='bg-primary h-2 w-2 rounded-full' />}
                      <span className='text-sm font-medium'>{notif.title}</span>
                    </div>
                    <p className='text-muted-foreground text-xs'>{notif.message}</p>
                    <p className='text-muted-foreground/60 text-[11px]'>
                      {formatDate(notif.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
