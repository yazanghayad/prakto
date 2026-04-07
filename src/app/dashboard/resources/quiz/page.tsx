import PageContainer from '@/components/layout/page-container';
import SkillsQuiz from '@/features/resources/components/skills-quiz';

export const metadata = {
  title: 'Kompetenstest | Prakto'
};

export default function QuizPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Kompetenstest'
      pageDescription='Svara på frågorna för att hitta vilka praktikområden som passar dig.'
    >
      <div className='flex-1 space-y-4'>
        <SkillsQuiz />
      </div>
    </PageContainer>
  );
}
