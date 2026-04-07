import PageContainer from '@/components/layout/page-container';
import BlogListing from '@/features/resources/blog/components/blog-listing';

export const metadata = {
  title: 'Blogg | Prakto'
};

export default function BlogPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Blogg'
      pageDescription='Artiklar och tips för att lyckas med din praktikansökan.'
    >
      <div className='flex-1 space-y-4'>
        <BlogListing />
      </div>
    </PageContainer>
  );
}
