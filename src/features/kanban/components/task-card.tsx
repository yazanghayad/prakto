'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KanbanItem } from '@/components/ui/kanban';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Task } from '../utils/store';
import { useTaskStore } from '../utils/store';
import { EditTaskDialog } from './edit-task-dialog';

interface TaskCardProps extends Omit<React.ComponentProps<typeof KanbanItem>, 'value'> {
  task: Task;
}

export function TaskCard({ task, ...props }: TaskCardProps) {
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <KanbanItem key={task.id} value={task.id} asChild {...props}>
        <div className='bg-card group relative rounded-md border p-3 shadow-xs'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between gap-2'>
              <span className='line-clamp-1 text-sm font-medium'>{task.title}</span>
              <div className='flex items-center gap-1'>
                <Badge
                  variant={
                    task.priority === 'high'
                      ? 'destructive'
                      : task.priority === 'medium'
                        ? 'default'
                        : 'secondary'
                  }
                  className='pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize'
                >
                  {task.priority}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Icons.ellipsis className='h-3.5 w-3.5' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Icons.edit className='mr-2 h-4 w-4' />
                      Redigera
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteTask(task.id)}
                      className='text-destructive'
                    >
                      <Icons.trash className='mr-2 h-4 w-4' />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            {task.description && (
              <p className='text-muted-foreground line-clamp-2 text-xs'>{task.description}</p>
            )}
            <div className='text-muted-foreground flex items-center justify-between text-xs'>
              {task.assignee && (
                <div className='flex items-center gap-1'>
                  <div className='bg-primary/20 size-2 rounded-full' />
                  <span className='line-clamp-1'>{task.assignee}</span>
                </div>
              )}
              {task.dueDate && <time className='text-[10px] tabular-nums'>{task.dueDate}</time>}
            </div>
          </div>
        </div>
      </KanbanItem>
      <EditTaskDialog task={task} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
