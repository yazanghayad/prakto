'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { CompanyListItem } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';

const APPROVAL_LABELS: Record<string, string> = {
  pending: 'Väntande',
  approved: 'Godkänd',
  rejected: 'Avvisad'
};

export const APPROVAL_OPTIONS = [
  { label: 'Väntande', value: 'pending' },
  { label: 'Godkänd', value: 'approved' },
  { label: 'Avvisad', value: 'rejected' }
];

export const columns: ColumnDef<CompanyListItem>[] = [
  {
    id: 'companyName',
    accessorKey: 'companyName',
    header: ({ column }: { column: Column<CompanyListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Företag' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.companyName}</span>
        <span className='text-muted-foreground text-xs'>{row.original.orgNumber}</span>
      </div>
    ),
    meta: {
      label: 'Företag',
      placeholder: 'Sök företag...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'industry',
    header: 'Bransch'
  },
  {
    accessorKey: 'city',
    header: 'Stad'
  },
  {
    accessorKey: 'contactEmail',
    header: 'Kontakt',
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='text-sm'>{row.original.contactEmail}</span>
        {row.original.contactPhone && (
          <span className='text-muted-foreground text-xs'>{row.original.contactPhone}</span>
        )}
      </div>
    )
  },
  {
    id: 'approvalStatus',
    accessorKey: 'approvalStatus',
    enableSorting: false,
    header: ({ column }: { column: Column<CompanyListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      const variant =
        status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'outline';
      return <Badge variant={variant}>{APPROVAL_LABELS[status] || status}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: APPROVAL_OPTIONS
    }
  }
];
