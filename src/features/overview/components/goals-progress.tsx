'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

interface GoalsProgressProps {
  totalGoals: number | undefined;
  completedGoals: number | undefined;
}

export function GoalsProgress({ totalGoals = 0, completedGoals = 0 }: GoalsProgressProps) {
  const percentage = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const remaining = totalGoals - completedGoals;

  // SVG circle math
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Mål & Framsteg</CardTitle>
        <CardDescription>
          {totalGoals > 0
            ? `${completedGoals} av ${totalGoals} mål avklarade`
            : 'Spåra dina LIA-mål'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col items-center justify-center gap-5 pt-0'>
        {totalGoals === 0 ? (
          <div className='flex flex-col items-center gap-3 py-6'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10'>
              <Icons.sparkles className='h-7 w-7 text-amber-500' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-medium'>Inga mål satta ännu</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Gå till Journal → Mål för att komma igång
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Ring chart */}
            <div className='relative'>
              <svg width={size} height={size} className='-rotate-90'>
                {/* Background ring */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={strokeWidth}
                  className='text-muted/20'
                />
                {/* Progress ring */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill='none'
                  stroke='currentColor'
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap='round'
                  className={cn(
                    'transition-all duration-700 ease-out',
                    percentage >= 75
                      ? 'text-emerald-500'
                      : percentage >= 40
                        ? 'text-amber-500'
                        : 'text-primary'
                  )}
                />
              </svg>
              {/* Center content */}
              <div className='absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-3xl font-bold tabular-nums'>{percentage}</span>
                <span className='text-muted-foreground text-[10px] font-medium uppercase tracking-widest'>
                  procent
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className='flex w-full gap-3'>
              <div className='bg-muted/50 flex flex-1 flex-col items-center rounded-lg py-2.5'>
                <div className='flex items-center gap-1'>
                  <div className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
                  <span className='text-muted-foreground text-[10px] uppercase tracking-wider'>
                    Klart
                  </span>
                </div>
                <span className='mt-0.5 text-lg font-bold tabular-nums'>{completedGoals}</span>
              </div>
              <div className='bg-muted/50 flex flex-1 flex-col items-center rounded-lg py-2.5'>
                <div className='flex items-center gap-1'>
                  <div className='bg-muted-foreground/30 h-1.5 w-1.5 rounded-full' />
                  <span className='text-muted-foreground text-[10px] uppercase tracking-wider'>
                    Kvar
                  </span>
                </div>
                <span className='mt-0.5 text-lg font-bold tabular-nums'>{remaining}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
