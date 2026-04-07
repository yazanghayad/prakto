'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { internshipByIdOptions } from '../api/queries';
import { InternshipPostView } from './internship-post-view';
import { ApplicationModal } from './application-modal';

interface StudentInternshipViewProps {
  id: string;
}

export function StudentInternshipView({ id }: Readonly<StudentInternshipViewProps>) {
  const [applyOpen, setApplyOpen] = useState(false);
  const { data: internship } = useSuspenseQuery(internshipByIdOptions(id));

  return (
    <>
      <InternshipPostView id={id} isOwner={false} onApply={() => setApplyOpen(true)} />
      <ApplicationModal internship={internship} open={applyOpen} onOpenChange={setApplyOpen} />
    </>
  );
}
