import PageContainer from '@/components/layout/page-container';
import BlogPostView from '@/features/resources/blog/components/blog-post-view';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { blogPostOptions } from '@/features/resources/blog/api/queries';
import { Suspense } from 'react';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(blogPostOptions(slug));

  return (
    <PageContainer scrollable>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <div className='mx-auto max-w-3xl animate-pulse space-y-4'>
              <div className='bg-muted h-6 w-32 rounded' />
              <div className='bg-muted h-56 w-full rounded-lg' />
              <div className='bg-muted h-8 w-3/4 rounded' />
              <div className='bg-muted h-64 w-full rounded-lg' />
            </div>
          }
        >
          <BlogPostView slug={slug} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
