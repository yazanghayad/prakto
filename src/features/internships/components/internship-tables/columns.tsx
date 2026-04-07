'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Internship } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  lia: 'LIA',
  vfu: 'VFU',
  apl: 'APL'
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  pending_review: 'Väntar granskning',
  published: 'Publicerad',
  rejected: 'Avvisad',
  closed: 'Stängd'
};

export const TYPE_OPTIONS = [
  { label: 'LIA', value: 'lia' },
  { label: 'VFU', value: 'vfu' },
  { label: 'APL', value: 'apl' }
];

export const STATUS_OPTIONS = [
  { label: 'Utkast', value: 'draft' },
  { label: 'Publicerad', value: 'published' },
  { label: 'Avvisad', value: 'rejected' },
  { label: 'Stängd', value: 'closed' }
];

export const columns: ColumnDef<Internship>[] = [
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<Internship, unknown> }) => (
      <DataTableColumnHeader column={column} title='Titel' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <Link
          href={`/dashboard/internships/${row.original.$id}`}
          className='hover:text-primary font-medium hover:underline'
        >
          {row.original.title}
        </Link>
        <span className='text-muted-foreground text-xs'>{row.original.field}</span>
      </div>
    ),
    meta: {
      label: 'Titel',
      placeholder: 'Sök praktikplatser...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'city',
    header: 'Stad',
    cell: ({ row }) => (
      <div className='flex items-center gap-1'>
        <span>{row.original.city}</span>
        {row.original.workplaceType && row.original.workplaceType !== 'on_site' && (
          <Badge variant='secondary' className='text-[10px]'>
            {row.original.workplaceType === 'remote' ? 'Distans' : 'Hybrid'}
          </Badge>
        )}
      </div>
    )
  },
  {
    id: 'internshipType',
    accessorKey: 'internshipType',
    enableSorting: false,
    header: ({ column }: { column: Column<Internship, unknown> }) => (
      <DataTableColumnHeader column={column} title='Typ' />
    ),
    cell: ({ cell }) => {
      const type = cell.getValue<string>();
      return <Badge variant='outline'>{TYPE_LABELS[type] || type}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Typ',
      variant: 'multiSelect' as const,
      options: TYPE_OPTIONS
    }
  },
  {
    accessorKey: 'spots',
    header: 'Platser',
    cell: ({ row }) => <span className='font-medium'>{row.original.spots}</span>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      const variant =
        status === 'published'
          ? 'default'
          : status === 'draft'
            ? 'secondary'
            : status === 'rejected'
              ? 'destructive'
              : 'outline';
      return <Badge variant={variant}>{STATUS_LABELS[status] || status}</Badge>;
    }
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<Internship, unknown> }) => (
      <DataTableColumnHeader column={column} title='Skapad' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <span className='text-muted-foreground text-sm'>{date.toLocaleDateString('sv-SE')}</span>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
