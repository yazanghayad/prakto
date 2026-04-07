import PageContainer from '@/components/layout/page-container';

export default function ExclusivePage() {
  return (
    <PageContainer pageTitle='Exklusivt' pageDescription='Premiumfunktioner'>
      <div className='text-muted-foreground rounded-lg border p-6'>
        <p>Premiumfunktioner kommer i en framtida version.</p>
      </div>
    </PageContainer>
  );
}
