'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blogListOptions } from '../api/queries';
import { blogCategories, categoryLabels } from '../constants/categories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';

export default function BlogListing() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery(blogListOptions({ page, limit: 12, category }));

  const posts = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className='space-y-6'>
      {/* Category filter */}
      <div className='flex flex-wrap gap-2'>
        <Button
          variant={!category ? 'default' : 'outline'}
          size='sm'
          onClick={() => {
            setCategory(undefined);
            setPage(1);
          }}
        >
          Alla
        </Button>
        {blogCategories.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? 'default' : 'outline'}
            size='sm'
            onClick={() => {
              setCategory(cat.value);
              setPage(1);
            }}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Posts grid */}
      {isLoading ? (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader>
                <div className='bg-muted h-4 w-16 rounded' />
                <div className='bg-muted mt-2 h-5 w-3/4 rounded' />
              </CardHeader>
              <CardContent>
                <div className='bg-muted h-12 w-full rounded' />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
            <Icons.article className='text-muted-foreground mb-3 h-10 w-10 opacity-30' />
            <p className='text-muted-foreground text-sm'>
              {category
                ? 'Inga inlägg i den här kategorin ännu.'
                : 'Inga blogginlägg publicerade ännu.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {posts.map((post) => (
            <Link key={post.$id} href={`/dashboard/resources/blog/${post.slug}`}>
              <Card className='hover:border-primary/30 h-full transition-colors'>
                {post.coverImageUrl && (
                  <div className='relative h-40 w-full overflow-hidden rounded-t-lg'>
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className='h-full w-full object-cover'
                    />
                  </div>
                )}
                <CardHeader className={post.coverImageUrl ? 'pt-3' : ''}>
                  <div className='flex items-center gap-2'>
                    <Badge variant='secondary' className='text-xs'>
                      {categoryLabels[post.category] || post.category}
                    </Badge>
                    {post.publishedAt && (
                      <span className='text-muted-foreground text-xs'>
                        {new Date(post.publishedAt).toLocaleDateString('sv-SE')}
                      </span>
                    )}
                  </div>
                  <CardTitle className='line-clamp-2 text-base'>{post.title}</CardTitle>
                </CardHeader>
                {post.excerpt && (
                  <CardContent className='pt-0'>
                    <CardDescription className='line-clamp-3'>{post.excerpt}</CardDescription>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <Icons.chevronLeft className='mr-1 h-4 w-4' />
            Föregående
          </Button>
          <span className='text-muted-foreground text-sm'>
            Sida {page} av {totalPages}
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Nästa
            <Icons.chevronRight className='ml-1 h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
