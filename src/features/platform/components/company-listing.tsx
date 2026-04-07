import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { companiesQueryOptions } from '../api/queries';
import { CompanyTable } from './company-tables';

export default function CompanyListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(companiesQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CompanyTable />
    </HydrationBoundary>
  );
}
