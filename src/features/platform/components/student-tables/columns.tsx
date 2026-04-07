'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { StudentListItem } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';

const PLACEMENT_LABELS: Record<string, string> = {
  searching: 'Söker',
  applied: 'Ansökt',
  placed: 'Placerad',
  completed: 'Klar'
};

const EDUCATION_LABELS: Record<string, string> = {
  yh: 'YH',
  university: 'Universitet',
  gymnasie: 'Gymnasium',
  other: 'Övrigt'
};

export const PLACEMENT_OPTIONS = [
  { label: 'Söker', value: 'searching' },
  { label: 'Ansökt', value: 'applied' },
  { label: 'Placerad', value: 'placed' },
  { label: 'Klar', value: 'completed' }
];

export const columns: ColumnDef<StudentListItem>[] = [
  {
    id: 'name',
    accessorKey: 'displayName',
    header: ({ column }: { column: Column<StudentListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Namn' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col'>
        <span className='font-medium'>{row.original.displayName || '–'}</span>
        <span className='text-muted-foreground text-xs'>{row.original.email || '–'}</span>
      </div>
    ),
    meta: {
      label: 'Namn',
      placeholder: 'Sök studenter...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'school',
    header: 'Skola'
  },
  {
    accessorKey: 'program',
    header: 'Program'
  },
  {
    accessorKey: 'educationLevel',
    header: 'Nivå',
    cell: ({ row }) => (
      <Badge variant='outline'>
        {EDUCATION_LABELS[row.original.educationLevel] || row.original.educationLevel}
      </Badge>
    )
  },
  {
    accessorKey: 'city',
    header: 'Stad'
  },
  {
    id: 'placementStatus',
    accessorKey: 'placementStatus',
    enableSorting: false,
    header: ({ column }: { column: Column<StudentListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      const variant =
        status === 'placed' || status === 'completed'
          ? 'default'
          : status === 'applied'
            ? 'secondary'
            : 'outline';
      return <Badge variant={variant}>{PLACEMENT_LABELS[status] || status}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: PLACEMENT_OPTIONS
    }
  }
];
