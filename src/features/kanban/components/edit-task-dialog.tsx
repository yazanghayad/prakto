'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { Task, Priority } from '../utils/store';
import { useTaskStore } from '../utils/store';

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const updateTask = useTaskStore((state) => state.updateTask);
  const [priority, setPriority] = useState<Priority>(task.priority);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const assignee = formData.get('assignee') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!title?.trim()) return;

    updateTask(task.id, {
      title: title.trim(),
      description: description || undefined,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
      priority
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Redigera uppgift</DialogTitle>
          <DialogDescription>Ändra detaljer för uppgiften.</DialogDescription>
        </DialogHeader>
        <form id='edit-task-form' className='grid gap-4 py-4' onSubmit={handleSubmit}>
          <div className='grid gap-2'>
            <Label htmlFor='edit-title'>Titel</Label>
            <Input id='edit-title' name='title' defaultValue={task.title} />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='edit-description'>Beskrivning</Label>
            <Textarea
              id='edit-description'
              name='description'
              defaultValue={task.description ?? ''}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='edit-assignee'>Tilldelad</Label>
            <Input id='edit-assignee' name='assignee' defaultValue={task.assignee ?? ''} />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit-dueDate'>Deadline</Label>
              <Input
                id='edit-dueDate'
                name='dueDate'
                type='date'
                defaultValue={task.dueDate ?? ''}
              />
            </div>
            <div className='grid gap-2'>
              <Label>Prioritet</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='low'>Low</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type='submit' size='sm' form='edit-task-form'>
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
