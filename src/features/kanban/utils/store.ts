import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
// import { persist } from 'zustand/middleware';

export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  priority: Priority;
  description?: string;
  assignee?: string;
  dueDate?: string;
};

type KanbanState = {
  columns: Record<string, Task[]>;
  setColumns: (columns: Record<string, Task[]>) => void;
  addTask: (title: string, description?: string) => void;
  updateTask: (taskId: string, data: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (taskId: string) => void;
  addColumn: (name: string) => void;
  renameColumn: (oldName: string, newName: string) => void;
  deleteColumn: (name: string) => void;
};

const initialColumns: Record<string, Task[]> = {
  backlog: [
    {
      id: '1',
      title: 'Skapa projektplan',
      priority: 'high',
      assignee: 'Sara Lindqvist',
      dueDate: '2026-04-08'
    },
    {
      id: '2',
      title: 'Förbereda presentationsmaterial',
      priority: 'medium',
      assignee: 'Erik Johansson',
      dueDate: '2026-04-12'
    },
    {
      id: '3',
      title: 'Skriv veckorapport',
      priority: 'low',
      assignee: 'Fatima Al-Hassan',
      dueDate: '2026-04-15'
    }
  ],
  inProgress: [
    {
      id: '4',
      title: 'Uppdatera handledardokument',
      priority: 'high',
      assignee: 'Oscar Bergström',
      dueDate: '2026-04-03'
    },
    {
      id: '5',
      title: 'Boka möte med handledare',
      priority: 'medium',
      assignee: 'Lina Pettersson',
      dueDate: '2026-04-06'
    }
  ],
  done: [
    {
      id: '6',
      title: 'Skicka in LIA-avtal',
      priority: 'high',
      assignee: 'Sara Lindqvist',
      dueDate: '2026-03-22'
    },
    {
      id: '7',
      title: 'Genomföra introduktionsmöte',
      priority: 'medium',
      assignee: 'Erik Johansson',
      dueDate: '2026-03-20'
    }
  ]
};

export const useTaskStore = create<KanbanState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set) => ({
    columns: initialColumns,

    setColumns: (columns) => set({ columns }),

    addTask: (title, description) =>
      set((state) => ({
        columns: {
          ...state.columns,
          backlog: [
            {
              id: uuid(),
              title,
              description,
              priority: 'medium' as Priority,
              assignee: undefined,
              dueDate: undefined
            },
            ...(state.columns.backlog ?? [])
          ]
        }
      })),

    updateTask: (taskId, data) =>
      set((state) => {
        const columns = { ...state.columns };
        for (const key of Object.keys(columns)) {
          columns[key] = columns[key].map((task) =>
            task.id === taskId ? { ...task, ...data } : task
          );
        }
        return { columns };
      }),

    deleteTask: (taskId) =>
      set((state) => {
        const columns: Record<string, Task[]> = {};
        for (const [key, tasks] of Object.entries(state.columns)) {
          columns[key] = tasks.filter((task) => task.id !== taskId);
        }
        return { columns };
      }),

    addColumn: (name) =>
      set((state) => ({
        columns: { ...state.columns, [name]: [] }
      })),

    renameColumn: (oldName, newName) =>
      set((state) => {
        if (oldName === newName) return state;
        const entries = Object.entries(state.columns).map(([key, tasks]) =>
          key === oldName ? [newName, tasks] : [key, tasks]
        );
        return { columns: Object.fromEntries(entries) };
      }),

    deleteColumn: (name) =>
      set((state) => {
        const { [name]: _, ...rest } = state.columns;
        return { columns: rest };
      })
  })
  //   ,
  //   { name: 'kanban-store' }
  // )
);
