'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { deleteInternshipMutation, updateInternshipMutation } from '../../api/mutations';
import type { Internship } from '../../api/types';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CellActionProps {
  data: Internship;
}

export function CellAction({ data }: CellActionProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

  const deleteMutation = useMutation({
    ...deleteInternshipMutation,
    onSuccess: () => {
      toast.success('Praktikplats borttagen.');
      setDeleteOpen(false);
    },
    onError: () => {
      toast.error('Kunde inte ta bort praktikplats.');
    }
  });

  const publishMutation = useMutation({
    ...updateInternshipMutation,
    onSuccess: () => {
      toast.success('Praktikplats publicerad.');
    },
    onError: () => {
      toast.error('Kunde inte publicera.');
    }
  });

  const canPublish =
    data.status === 'draft' || data.status === 'pending_review' || data.status === 'rejected';

  return (
    <>
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(data.$id)}
        loading={deleteMutation.isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Öppna meny</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/listings/${data.$id}`)}>
            <Icons.edit className='mr-2 h-4 w-4' /> Redigera
          </DropdownMenuItem>
          {canPublish && (
            <DropdownMenuItem
              onClick={() =>
                publishMutation.mutate({
                  id: data.$id,
                  data: { status: 'published' }
                })
              }
            >
              <Icons.send className='mr-2 h-4 w-4' /> Publicera
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Ta bort
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
