'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { applicationsQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

interface ApplicationTableProps {
  studentId?: string;
  companyId?: string;
  internshipId?: string;
}

export function ApplicationTable({ studentId, companyId, internshipId }: ApplicationTableProps) {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    status: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.status && { status: params.status }),
    ...(studentId && { studentId }),
    ...(companyId && { companyId }),
    ...(internshipId && { internshipId }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data, isLoading } = useQuery(applicationsQueryOptions(filters));

  const applications = data?.applications ?? [];
  const pageCount = Math.ceil((data?.total ?? 0) / params.perPage);

  const { table } = useDataTable({
    data: applications,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500
  });

  if (isLoading) {
    return <ApplicationTableSkeleton />;
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function ApplicationTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
