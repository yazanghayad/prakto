import { getApplicationStatusData } from '@/features/overview/api/service';
import { ApplicationStatusChart } from '@/features/overview/components/application-status-chart';

export default async function PieStats() {
  const data = await getApplicationStatusData();
  return <ApplicationStatusChart data={data ?? undefined} />;
}
