import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';
import NewColumnDialog from './new-column-dialog';

export default function KanbanViewPage() {
  return (
    <PageContainer
      pageTitle='Kanban'
      pageDescription='Manage tasks with drag and drop'
      pageHeaderAction={
        <div className='flex gap-2'>
          <NewColumnDialog />
          <NewTaskDialog />
        </div>
      }
    >
      <KanbanBoard />
    </PageContainer>
  );
}
