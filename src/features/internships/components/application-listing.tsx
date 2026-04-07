import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { ApplicationTable } from './application-tables';

interface ApplicationListingPageProps {
  studentId?: string;
  companyId?: string;
  internshipId?: string;
}

export default function ApplicationListingPage({
  studentId,
  companyId,
  internshipId
}: ApplicationListingPageProps) {
  const queryClient = getQueryClient();

  // No server prefetch — the /api/applications route requires auth cookies
  // which aren't forwarded during SSR fetch. The client component will fetch on mount.
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApplicationTable studentId={studentId} companyId={companyId} internshipId={internshipId} />
    </HydrationBoundary>
  );
}
