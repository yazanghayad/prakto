'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KanbanColumn, KanbanColumnHandle } from '@/components/ui/kanban';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTaskStore } from '../utils/store';
import type { Task } from '../utils/store';
import { TaskCard } from './task-card';

const COLUMN_TITLES: Record<string, string> = {
  backlog: 'Backlog',
  inProgress: 'In Progress',
  review: 'Review',
  done: 'Done'
};

interface TaskColumnProps extends Omit<React.ComponentProps<typeof KanbanColumn>, 'children'> {
  tasks: Task[];
}

export function TaskColumn({ value, tasks, ...props }: TaskColumnProps) {
  const { renameColumn, deleteColumn } = useTaskStore();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(value);

  const handleRename = () => {
    const trimmed = String(renameValue).trim();
    if (trimmed && trimmed !== value) {
      renameColumn(String(value), trimmed);
    }
    setIsRenaming(false);
  };

  return (
    <KanbanColumn value={value} className='w-[320px] shrink-0' {...props}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {isRenaming ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className='h-7 w-40 text-sm font-semibold'
              autoFocus
            />
          ) : (
            <span className='text-sm font-semibold'>{COLUMN_TITLES[value] ?? value}</span>
          )}
          <Badge variant='secondary' className='pointer-events-none rounded-sm'>
            {tasks.length}
          </Badge>
        </div>
        <div className='flex items-center gap-0.5'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-7 w-7'>
                <Icons.ellipsis className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => {
                  setRenameValue(value);
                  setIsRenaming(true);
                }}
              >
                <Icons.edit className='mr-2 h-4 w-4' />
                Byt namn
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteColumn(String(value))}
                className='text-destructive'
              >
                <Icons.trash className='mr-2 h-4 w-4' />
                Ta bort lista
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <KanbanColumnHandle asChild>
            <Button variant='ghost' size='icon' className='h-7 w-7'>
              <Icons.gripVertical className='h-4 w-4' />
            </Button>
          </KanbanColumnHandle>
        </div>
      </div>
      <div className='flex flex-col gap-2 p-0.5'>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} asHandle />
        ))}
      </div>
    </KanbanColumn>
  );
}
