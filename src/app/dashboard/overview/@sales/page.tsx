import { getRecentActivityData } from '@/features/overview/api/service';
import { RecentActivity } from '@/features/overview/components/recent-activity';

export default async function RecentActivitySlot() {
  const data = await getRecentActivityData();
  return <RecentActivity data={data ?? undefined} />;
}
