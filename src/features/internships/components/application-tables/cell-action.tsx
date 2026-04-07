'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { updateApplicationStatusMutation } from '../../api/mutations';
import type { Application } from '../../api/types';
import { Icons } from '@/components/icons';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApplicationDetailSheet } from './application-detail-sheet';

interface CellActionProps {
  data: Application;
}

export function CellAction({ data }: Readonly<CellActionProps>) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const updateStatus = useMutation({
    ...updateApplicationStatusMutation,
    onSuccess: () => {
      toast.success('Status uppdaterad.');
    },
    onError: () => {
      toast.error('Kunde inte uppdatera status.');
    }
  });

  const canReview = data.status === 'submitted' || data.status === 'reviewed';

  const EyeIcon = Icons.eye;
  const EllipsisIcon = Icons.ellipsis;
  const CheckIcon = Icons.check;
  const CalendarIcon = Icons.calendar;
  const CircleCheckIcon = Icons.circleCheck;
  const XCircleIcon = Icons.xCircle;

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Öppna meny</span>
            <EllipsisIcon className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Hantera ansökan</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSheetOpen(true)}>
            <EyeIcon className='mr-2 h-4 w-4' /> Visa detaljer
          </DropdownMenuItem>
          {canReview && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  updateStatus.mutate({
                    id: data.$id,
                    status: 'reviewed'
                  })
                }
              >
                <CheckIcon className='mr-2 h-4 w-4' /> Markera som granskad
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateStatus.mutate({
                    id: data.$id,
                    status: 'interview'
                  })
                }
              >
                <CalendarIcon className='mr-2 h-4 w-4' /> Bjud in till intervju
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  updateStatus.mutate({
                    id: data.$id,
                    status: 'accepted'
                  })
                }
              >
                <CircleCheckIcon className='mr-2 h-4 w-4' /> Acceptera
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  updateStatus.mutate({
                    id: data.$id,
                    status: 'rejected'
                  })
                }
              >
                <XCircleIcon className='mr-2 h-4 w-4' /> Avslå
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ApplicationDetailSheet application={data} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
