'use client';

import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-auth';
import { notificationsQueryOptions, notificationKeys } from '../api/queries';
import { markNotificationAsRead, markAllNotificationsAsRead } from '../api/service';
import type { AppNotification } from '../api/service';

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

  return d.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function NotificationsPage() {
  const { isAuthenticated } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    ...notificationsQueryOptions({ limit: 50 }),
    enabled: isAuthenticated
  });

  const notifications = data?.notifications ?? [];
  const count = data?.unreadCount ?? 0;

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

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

  const renderList = (items: AppNotification[]) => {
    if (isLoading) {
      return (
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-20 w-full rounded-lg' />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>Inga notiser</p>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-1'>
        {items.map((notif) => (
          <button
            key={notif.$id}
            onClick={() => handleClick(notif)}
            className={`hover:bg-accent flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
              !notif.isRead ? 'bg-accent/50 border-border' : 'border-transparent'
            }`}
          >
            <div className='flex-1 space-y-1'>
              <div className='flex items-center gap-2'>
                {!notif.isRead && <span className='bg-primary h-2 w-2 rounded-full' />}
                <span className='text-sm font-medium'>{notif.title}</span>
                <span className='text-muted-foreground/60 ml-auto text-xs'>
                  {formatDate(notif.createdAt)}
                </span>
              </div>
              <p className='text-muted-foreground text-sm'>{notif.message}</p>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className='mb-4 flex items-center justify-end'>
        {count > 0 && (
          <Button variant='outline' size='sm' onClick={() => markAllReadMutation.mutate()}>
            Markera alla lästa
          </Button>
        )}
      </div>
      <Tabs defaultValue='all'>
        <TabsList>
          <TabsTrigger value='all'>Alla ({notifications.length})</TabsTrigger>
          <TabsTrigger value='unread'>Olästa ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value='read'>Lästa ({readNotifications.length})</TabsTrigger>
        </TabsList>
        <TabsContent value='all' className='mt-4'>
          {renderList(notifications)}
        </TabsContent>
        <TabsContent value='unread' className='mt-4'>
          {renderList(unreadNotifications)}
        </TabsContent>
        <TabsContent value='read' className='mt-4'>
          {renderList(readNotifications)}
        </TabsContent>
      </Tabs>
    </>
  );
}
