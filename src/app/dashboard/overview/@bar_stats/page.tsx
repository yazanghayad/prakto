import { getWeeklyHoursData } from '@/features/overview/api/service';
import { WeeklyHoursChart } from '@/features/overview/components/weekly-hours-chart';

export default async function BarStats() {
  const data = await getWeeklyHoursData();
  return <WeeklyHoursChart data={data ?? undefined} />;
}
