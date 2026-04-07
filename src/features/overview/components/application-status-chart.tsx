'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

// Explicit colors per status — theme-independent so they're always meaningful
const STATUS_META: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Skickade', color: 'oklch(0.63 0.17 250)' },
  reviewed: { label: 'Granskade', color: 'oklch(0.75 0.15 80)' },
  interview: { label: 'Intervju', color: 'oklch(0.60 0.19 295)' },
  accepted: { label: 'Antagna', color: 'oklch(0.65 0.19 155)' },
  rejected: { label: 'Avslag', color: 'oklch(0.60 0.20 25)' },
  withdrawn: { label: 'Återtagna', color: 'oklch(0.55 0.02 250)' }
};

const chartConfig = {
  count: { label: 'Antal' },
  submitted: { label: 'Skickade', color: 'oklch(0.63 0.17 250)' },
  reviewed: { label: 'Granskade', color: 'oklch(0.75 0.15 80)' },
  interview: { label: 'Intervju', color: 'oklch(0.60 0.19 295)' },
  accepted: { label: 'Antagna', color: 'oklch(0.65 0.19 155)' },
  rejected: { label: 'Avslag', color: 'oklch(0.60 0.20 25)' },
  withdrawn: { label: 'Återtagna', color: 'oklch(0.55 0.02 250)' }
} satisfies ChartConfig;

interface ApplicationStatusChartProps {
  data: Record<string, number> | undefined;
}

export function ApplicationStatusChart({ data }: ApplicationStatusChartProps) {
  const entries = data ? Object.entries(data) : [];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const chartData = entries.map(([status, count]) => ({
    status,
    label: STATUS_META[status]?.label || status,
    count,
    fill: STATUS_META[status]?.color || 'var(--chart-1)'
  }));

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-base'>Ansökningsstatus</CardTitle>
        <CardDescription>
          {total > 0 ? `${total} ansökningar totalt` : 'Fördelning av dina ansökningar'}
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col items-center justify-center gap-4 pt-0'>
        {total === 0 ? (
          <div className='flex flex-col items-center gap-3 py-6'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10'>
              <svg
                className='h-7 w-7 text-blue-500'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'
                />
              </svg>
            </div>
            <div className='text-center'>
              <p className='text-sm font-medium'>Inga ansökningar ännu</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Sök praktikplatser för att komma igång
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Donut with center label */}
            <div className='relative'>
              <ChartContainer config={chartConfig} className='mx-auto h-[180px] w-[180px]'>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey='label' hideLabel />} />
                  <Pie
                    data={chartData}
                    innerRadius={55}
                    outerRadius={80}
                    dataKey='count'
                    nameKey='label'
                    cornerRadius={4}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              {/* Center number */}
              <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-3xl font-bold'>{total}</span>
                <span className='text-muted-foreground text-[10px] uppercase tracking-wider'>
                  totalt
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className='grid w-full grid-cols-2 gap-x-6 gap-y-2 px-2'>
              {chartData.map((entry) => (
                <div key={entry.status} className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <span
                      className='h-2.5 w-2.5 shrink-0 rounded-full'
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className='text-muted-foreground text-xs'>{entry.label}</span>
                  </div>
                  <span className='text-xs font-semibold tabular-nums'>{entry.count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
