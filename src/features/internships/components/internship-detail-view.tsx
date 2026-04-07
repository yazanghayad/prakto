'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { internshipByIdOptions } from '@/features/internships/api/queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { useUser } from '@/hooks/use-auth';
import { INTERNSHIP_TYPE_LABELS } from '@/types/platform';
import { BookmarkButton } from '@/features/bookmarks/components/bookmark-button';

interface InternshipDetailViewProps {
  id: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Utkast',
  pending_review: 'Väntar granskning',
  published: 'Publicerad',
  rejected: 'Avvisad',
  closed: 'Stängd'
};

export function InternshipDetailView({ id }: InternshipDetailViewProps) {
  const { data: internship } = useSuspenseQuery(internshipByIdOptions(id));
  const { profile } = useUser();

  const isStudent = profile?.role === 'student';

  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>{internship.title}</h2>
          <div className='text-muted-foreground mt-1 flex items-center gap-2 text-sm'>
            <Icons.building className='h-4 w-4' />
            <span>{internship.companyName || internship.companyId}</span>
            <span>•</span>
            <span>{internship.city}</span>
            {internship.workplaceType && internship.workplaceType !== 'on_site' && (
              <>
                <span>•</span>
                <Badge variant='secondary'>
                  {internship.workplaceType === 'remote' ? 'Distans' : 'Hybrid'}
                </Badge>
              </>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant={internship.status === 'published' ? 'default' : 'secondary'}>
            {STATUS_LABELS[internship.status] || internship.status}
          </Badge>
          <Badge variant='outline'>
            {INTERNSHIP_TYPE_LABELS[internship.internshipType] || internship.internshipType}
          </Badge>
          <BookmarkButton internshipId={id} variant='full' />
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <div className='md:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Beskrivning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm whitespace-pre-wrap'>{internship.description}</p>
            </CardContent>
          </Card>

          {internship.requirements && (
            <Card>
              <CardHeader>
                <CardTitle>Krav</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm whitespace-pre-wrap'>{internship.requirements}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Detaljer</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Område</span>
                <span className='font-medium'>{internship.field}</span>
              </div>
              <Separator />
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Typ</span>
                <span className='font-medium'>
                  {INTERNSHIP_TYPE_LABELS[internship.internshipType]}
                </span>
              </div>
              <Separator />
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Platser</span>
                <span className='font-medium'>{internship.spots}</span>
              </div>
              {internship.duration && (
                <>
                  <Separator />
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Varaktighet</span>
                    <span className='font-medium'>{internship.duration}</span>
                  </div>
                </>
              )}
              {internship.startDate && (
                <>
                  <Separator />
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Startdatum</span>
                    <span className='font-medium'>
                      {new Date(internship.startDate).toLocaleDateString('sv-SE')}
                    </span>
                  </div>
                </>
              )}
              <Separator />
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Publicerad</span>
                <span className='font-medium'>
                  {new Date(internship.createdAt).toLocaleDateString('sv-SE')}
                </span>
              </div>
            </CardContent>
          </Card>

          {isStudent && internship.status === 'published' && (
            <Button className='w-full' size='lg'>
              <Icons.send className='mr-2 h-4 w-4' />
              Ansök nu
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
