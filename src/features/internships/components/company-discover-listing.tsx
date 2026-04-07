import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { discoverCompaniesOptions } from '../api/discover-queries';
import { CompanyDiscoverGrid } from './company-discover-grid';

export default function CompanyDiscoverListing() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(discoverCompaniesOptions({ page: 1, limit: 12 }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CompanyDiscoverGrid />
    </HydrationBoundary>
  );
}
