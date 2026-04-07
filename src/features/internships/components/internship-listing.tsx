import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { internshipsQueryOptions } from '../api/queries';
import { InternshipTable } from './internship-tables';

interface InternshipListingPageProps {
  statusFilter?: string;
  companyId?: string;
}

export default function InternshipListingPage({
  statusFilter,
  companyId
}: InternshipListingPageProps) {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const internshipType = searchParamsCache.get('category');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(internshipType && { internshipType }),
    ...(statusFilter && { status: statusFilter }),
    ...(companyId && { companyId }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(internshipsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InternshipTable statusFilter={statusFilter} companyId={companyId} />
    </HydrationBoundary>
  );
}
