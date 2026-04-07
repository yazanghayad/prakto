'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

const resourcesNav = [
  {
    title: 'CV-generator',
    href: '/dashboard/resources/cv',
    icon: Icons.cvDocument,
    description: 'Skapa ett professionellt CV'
  },
  {
    title: 'Personligt brev',
    href: '/dashboard/resources/letter',
    icon: Icons.writing,
    description: 'Skriv ett övertygande brev'
  },
  {
    title: 'Intervjuförberedelse',
    href: '/dashboard/resources/interview',
    icon: Icons.interviewPrep,
    description: 'Frågor, svar & tips'
  },
  {
    title: 'Kompetenstest',
    href: '/dashboard/resources/quiz',
    icon: Icons.quiz,
    description: 'Identifiera dina styrkor'
  },
  {
    title: 'Mallbibliotek',
    href: '/dashboard/resources/templates',
    icon: Icons.templates,
    description: 'CV- och brevmallar'
  },
  {
    title: 'Checklista',
    href: '/dashboard/resources/checklist',
    icon: Icons.checklist,
    description: 'Praktikens alla steg'
  },
  {
    title: 'Blogg',
    href: '/dashboard/resources/blog',
    icon: Icons.article,
    description: 'Tips och artiklar'
  }
];

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='flex h-[calc(100dvh-52px)]'>
      {/* ─── Resources Sidebar ───────────────────────────── */}
      <aside className='bg-muted/40 hidden w-60 shrink-0 flex-col border-r md:flex'>
        <div className='p-4 pb-2'>
          <h2 className='text-sm font-semibold tracking-tight'>Resurser</h2>
          <p className='text-muted-foreground text-xs'>Verktyg för din ansökan</p>
        </div>
        <nav className='flex-1 space-y-1 px-2 py-2'>
          {resourcesNav.map((item) => {
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
        {resourcesNav.map((item) => {
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
