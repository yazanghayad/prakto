'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const journalNav = [
  {
    title: 'Praktik-dagbok',
    href: '/dashboard/journal/dagbok',
    icon: Icons.writing,
    description: 'Dokumentera varje vecka'
  },
  {
    title: 'Mål-tracker',
    href: '/dashboard/journal/goals',
    icon: Icons.listCheck,
    description: 'Bocka av kursmål'
  },
  {
    title: 'Anteckningar',
    href: '/dashboard/journal/notes',
    icon: Icons.post,
    description: 'Fria anteckningar'
  },
  {
    title: 'Tidrapport',
    href: '/dashboard/journal/tidrapport',
    icon: Icons.clockHour,
    description: 'Logga arbetstimmar'
  },
  {
    title: 'Handledarmöten',
    href: '/dashboard/journal/meetings',
    icon: Icons.mentorChat,
    description: 'Möten med handledare'
  },
  {
    title: 'Feedback-logg',
    href: '/dashboard/journal/feedback',
    icon: Icons.thumbUp,
    description: 'Feedback du fått'
  },
  {
    title: 'Kontakter',
    href: '/dashboard/journal/contacts',
    icon: Icons.addressBook,
    description: 'Personer under LIA'
  },
  {
    title: 'Veckorapport',
    href: '/dashboard/journal/report',
    icon: Icons.fileReport,
    description: 'Exportera rapport'
  }
];

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='flex h-[calc(100dvh-52px)]'>
      {/* ─── Journal Sidebar ─────────────────────────────── */}
      <aside className='bg-muted/40 hidden w-60 shrink-0 flex-col border-r md:flex'>
        <div className='p-4 pb-2'>
          <h2 className='text-sm font-semibold tracking-tight'>Journal</h2>
          <p className='text-muted-foreground text-xs'>Din LIA-period</p>
        </div>
        <nav className='flex-1 space-y-1 px-2 py-2'>
          {journalNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const ItemIcon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <ItemIcon className='h-4 w-4 shrink-0' />
                <div className='min-w-0'>
                  <span className='block truncate'>{item.title}</span>
                  <span
                    className={cn(
                      'block truncate text-[11px]',
                      isActive ? 'text-primary/70' : 'text-muted-foreground/70'
                    )}
                  >
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ─── Mobile nav (visible < md) ───────────────────── */}
      <div className='bg-muted/40 flex overflow-x-auto border-b p-2 md:hidden'>
        {journalNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <ItemIcon className='h-3.5 w-3.5' />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className='flex-1 overflow-auto'>{children}</div>
    </div>
  );
}
