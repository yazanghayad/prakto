import { getGoalsData } from '@/features/overview/api/service';
import { GoalsProgress } from '@/features/overview/components/goals-progress';

export default async function GoalsSlot() {
  const data = await getGoalsData();
  return <GoalsProgress totalGoals={data?.totalGoals} completedGoals={data?.completedGoals} />;
}
