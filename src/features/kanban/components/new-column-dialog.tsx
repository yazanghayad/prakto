'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useTaskStore } from '../utils/store';

export default function NewColumnDialog() {
  const addColumn = useTaskStore((state) => state.addColumn);
  const columns = useTaskStore((state) => state.columns);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');
    if (typeof name !== 'string' || !name.trim()) return;

    const key = name.trim().replace(/\s+/g, '_').toLowerCase();
    if (columns[key]) return;

    addColumn(key);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          <Icons.add className='mr-1 h-4 w-4' />
          Ny lista
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Ny lista</DialogTitle>
          <DialogDescription>Skapa en ny kolumn i din kanban-tavla.</DialogDescription>
        </DialogHeader>
        <form id='column-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <Input id='name' name='name' placeholder='Namn på listan...' autoFocus />
        </form>
        <DialogFooter>
          <Button type='submit' size='sm' form='column-form'>
            Skapa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
