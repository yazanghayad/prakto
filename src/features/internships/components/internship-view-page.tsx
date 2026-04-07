'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { notFound, useSearchParams } from 'next/navigation';
import { internshipByIdOptions } from '../api/queries';
import InternshipCreateForm from './internship-create-form';
import { InternshipPostView } from './internship-post-view';
import type { CompanyProfile } from '@/features/company/api/types';

interface InternshipViewPageProps {
  internshipId: string;
  companyId: string;
  company?: CompanyProfile | null;
}

export default function InternshipViewPage({
  internshipId,
  companyId,
  company
}: Readonly<InternshipViewPageProps>) {
  if (internshipId === 'new') {
    return (
      <InternshipCreateForm
        initialData={null}
        companyId={companyId}
        companyName={company?.companyName ?? ''}
        companyCity={company?.city ?? ''}
        contactEmail={company?.contactEmail ?? ''}
      />
    );
  }

  return (
    <ViewOrEditInternship internshipId={internshipId} companyId={companyId} company={company} />
  );
}

function ViewOrEditInternship({
  internshipId,
  companyId,
  company
}: Readonly<{
  internshipId: string;
  companyId: string;
  company?: CompanyProfile | null;
}>) {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const { data } = useSuspenseQuery(internshipByIdOptions(internshipId));

  if (!data) {
    notFound();
  }

  if (isEditMode) {
    return (
      <InternshipCreateForm
        initialData={data}
        companyId={companyId}
        companyName={company?.companyName ?? ''}
        companyCity={company?.city ?? ''}
        contactEmail={company?.contactEmail ?? ''}
      />
    );
  }

  return <InternshipPostView id={internshipId} isOwner />;
}
