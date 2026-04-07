import NoteEditorPage from '@/features/lia-notes/components/note-editor-page';

export const metadata = {
  title: 'Redigera anteckning | Prakto'
};

export default async function Page({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;

  return (
    <div className='h-[calc(100dvh-52px)]'>
      <NoteEditorPage noteId={noteId} />
    </div>
  );
}
