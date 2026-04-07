import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { studentsQueryOptions } from '../api/queries';
import { StudentTable } from './student-tables';

export default function StudentListingPage() {
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

  void queryClient.prefetchQuery(studentsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StudentTable />
    </HydrationBoundary>
  );
}
