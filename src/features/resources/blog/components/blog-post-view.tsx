'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { blogPostOptions } from '../api/queries';
import { categoryLabels } from '../constants/categories';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';

interface BlogPostViewProps {
  slug: string;
}

export default function BlogPostView({ slug }: Readonly<BlogPostViewProps>) {
  const { data } = useSuspenseQuery(blogPostOptions(slug));
  const post = data.post;

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      {/* Back link */}
      <Button variant='ghost' size='sm' asChild>
        <Link href='/dashboard/resources/blog'>
          <Icons.arrowLeft className='mr-1.5 h-4 w-4' />
          Tillbaka till bloggen
        </Link>
      </Button>

      <Card>
        {post.coverImageUrl && (
          <div className='relative h-56 w-full overflow-hidden rounded-t-lg sm:h-72'>
            <img src={post.coverImageUrl} alt={post.title} className='h-full w-full object-cover' />
          </div>
        )}

        <CardHeader className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Badge variant='secondary'>{categoryLabels[post.category] || post.category}</Badge>
            {post.publishedAt && (
              <span className='text-muted-foreground text-sm'>
                {new Date(post.publishedAt).toLocaleDateString('sv-SE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
          <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>{post.title}</h1>
          {post.excerpt && (
            <p className='text-muted-foreground text-base leading-relaxed'>{post.excerpt}</p>
          )}
        </CardHeader>

        <CardContent>
          <div className='prose prose-sm dark:prose-invert max-w-none whitespace-pre-line leading-relaxed'>
            {post.content}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
