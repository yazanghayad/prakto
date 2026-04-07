'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { Icons } from '@/components/icons';

const chartConfig = {
  development: { label: 'Utveckling', color: 'oklch(0.63 0.17 250)' },
  meeting: { label: 'Möten', color: 'oklch(0.60 0.19 295)' },
  learning: { label: 'Lärande', color: 'oklch(0.65 0.19 155)' },
  other: { label: 'Övrigt', color: 'oklch(0.70 0.10 80)' }
} satisfies ChartConfig;

interface WeeklyHoursEntry {
  week: string;
  development: number;
  meeting: number;
  learning: number;
  other: number;
}

interface WeeklyHoursChartProps {
  data: WeeklyHoursEntry[] | undefined;
}

export function WeeklyHoursChart({ data }: WeeklyHoursChartProps) {
  const chartData = data ?? [];

  // Calculate total hours
  const totalHours = chartData.reduce(
    (sum, w) => sum + w.development + w.meeting + w.learning + w.other,
    0
  );

  // Show last 8 weeks max
  const displayData = chartData.slice(-8);

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base'>Timmar per vecka</CardTitle>
            <CardDescription>
              {totalHours > 0
                ? `${Math.round(totalHours)} timmar totalt loggade`
                : 'Loggad tid per kategori'}
            </CardDescription>
          </div>
          {totalHours > 0 && (
            <div className='bg-muted flex items-center gap-1.5 rounded-md px-2.5 py-1'>
              <Icons.clock className='text-muted-foreground h-3.5 w-3.5' />
              <span className='text-sm font-semibold tabular-nums'>{Math.round(totalHours)}h</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col pt-0'>
        {displayData.length === 0 ? (
          <div className='flex flex-1 flex-col items-center justify-center gap-3 py-6'>
            <div className='flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10'>
              <Icons.clock className='h-7 w-7 text-emerald-500' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-medium'>Inga tidsrapporter ännu</p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Gå till Journal → Tidrapport för att logga tid
              </p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className='mt-2 h-[250px] w-full'>
            <BarChart
              accessibilityLayer
              data={displayData}
              barGap={2}
              barCategoryGap='35%'
              maxBarSize={56}
            >
              {' '}
              <CartesianGrid vertical={false} strokeDasharray='3 3' className='opacity-50' />
              <XAxis
                dataKey='week'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                fontSize={11}
                width={30}
                tickFormatter={(v) => `${v}h`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <span className='tabular-nums'>
                        {value}h {chartConfig[name as keyof typeof chartConfig]?.label}
                      </span>
                    )}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey='development'
                stackId='hours'
                fill='var(--color-development)'
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey='meeting'
                stackId='hours'
                fill='var(--color-meeting)'
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey='learning'
                stackId='hours'
                fill='var(--color-learning)'
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey='other'
                stackId='hours'
                fill='var(--color-other)'
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
