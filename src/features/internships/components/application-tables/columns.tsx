'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Application } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Inskickad',
  reviewed: 'Granskad',
  interview: 'Intervju',
  accepted: 'Accepterad',
  rejected: 'Avvisad',
  withdrawn: 'Indragen'
};

export const STATUS_OPTIONS = [
  { label: 'Inskickad', value: 'submitted' },
  { label: 'Granskad', value: 'reviewed' },
  { label: 'Intervju', value: 'interview' },
  { label: 'Accepterad', value: 'accepted' },
  { label: 'Avvisad', value: 'rejected' },
  { label: 'Indragen', value: 'withdrawn' }
];

const CV_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const CV_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
const CV_BUCKET = 'cvs';

function getCvDownloadUrl(fileId: string) {
  return `${CV_ENDPOINT}/storage/buckets/${CV_BUCKET}/files/${fileId}/download?project=${CV_PROJECT}`;
}

export const columns: ColumnDef<Application>[] = [
  {
    id: 'company',
    accessorKey: 'companyName',
    header: ({ column }: { column: Column<Application, unknown> }) => (
      <DataTableColumnHeader column={column} title='Företag' />
    ),
    cell: ({ row }) => {
      const BuildingIcon = Icons.building;
      return (
        <div className='flex items-center gap-2'>
          <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-full'>
            <BuildingIcon className='text-muted-foreground h-4 w-4' />
          </div>
          <span className='font-medium'>{row.original.companyName || 'Okänt företag'}</span>
        </div>
      );
    }
  },
  {
    id: 'internship',
    accessorKey: 'internshipTitle',
    header: ({ column }: { column: Column<Application, unknown> }) => (
      <DataTableColumnHeader column={column} title='Praktikplats' />
    ),
    cell: ({ row }) => (
      <span className='text-sm'>{row.original.internshipTitle || 'Praktikplats'}</span>
    )
  },
  {
    id: 'status',
    accessorKey: 'status',
    enableSorting: false,
    header: ({ column }: { column: Column<Application, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      const variantMap: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
        accepted: 'default',
        rejected: 'destructive',
        interview: 'secondary'
      };
      const variant = variantMap[status] ?? 'outline';
      return <Badge variant={variant}>{STATUS_LABELS[status] || status}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: STATUS_OPTIONS
    }
  },
  {
    accessorKey: 'appliedAt',
    header: ({ column }: { column: Column<Application, unknown> }) => (
      <DataTableColumnHeader column={column} title='Datum' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.appliedAt);
      return (
        <span className='text-muted-foreground text-sm'>{date.toLocaleDateString('sv-SE')}</span>
      );
    }
  },
  {
    accessorKey: 'message',
    header: 'Meddelande',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm line-clamp-1'>
        {row.original.message || '–'}
      </span>
    )
  },
  {
    id: 'cv',
    header: 'CV',
    cell: ({ row }) => {
      const fileId = row.original.cvFileId;
      if (!fileId) {
        return <span className='text-muted-foreground text-xs'>–</span>;
      }
      const DownloadIcon = Icons.download;
      return (
        <a
          href={getCvDownloadUrl(fileId)}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex'
        >
          <Button variant='ghost' size='icon' className='h-8 w-8'>
            <DownloadIcon className='h-4 w-4' />
          </Button>
        </a>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
