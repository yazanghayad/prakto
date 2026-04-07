'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const aiToolsNav = [
  {
    title: 'Matchning',
    href: '/dashboard/ai-tools/match',
    icon: Icons.sparkles,
    description: 'Matcha mot praktikplats'
  },
  {
    title: 'Personligt brev',
    href: '/dashboard/ai-tools/cover-letter',
    icon: Icons.page,
    description: 'Generera personligt brev'
  },
  {
    title: 'Profiltips',
    href: '/dashboard/ai-tools/profile-tips',
    icon: Icons.bulb,
    description: 'Förbättra din profil'
  },
  {
    title: 'Intervju',
    href: '/dashboard/ai-tools/interview',
    icon: Icons.chat,
    description: 'Förbered för intervju'
  },
  {
    title: 'Kompetensgap',
    href: '/dashboard/ai-tools/skill-gap',
    icon: Icons.quiz,
    description: 'Analysera kunskapsluckor'
  }
];

export default function AIToolsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='flex h-[calc(100dvh-52px)]'>
      {/* ─── AI Tools Sidebar ────────────────────────────── */}
      <aside className='bg-muted/40 hidden w-60 shrink-0 flex-col border-r md:flex'>
        <div className='p-4 pb-2'>
          <h2 className='text-sm font-semibold tracking-tight'>AI-verktyg</h2>
          <p className='text-muted-foreground text-xs'>Smarta hjälpmedel</p>
        </div>
        <nav className='flex-1 space-y-1 px-2 py-2'>
          {aiToolsNav.map((item) => {
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
        {aiToolsNav.map((item) => {
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
