'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createInternshipMutation, updateInternshipMutation } from '../api/mutations';
import type { Internship } from '../api/types';
import { internshipSchema, type InternshipFormValues } from '../schemas/internship';
import { fieldOptions, internshipTypeOptions } from '@/features/company/constants/options';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';

interface InternshipFormProps {
  initialData: Internship | null;
  companyId: string;
  pageTitle: string;
}

export default function InternshipForm({
  initialData,
  companyId,
  pageTitle
}: Readonly<InternshipFormProps>) {
  const router = useRouter();
  const isEdit = !!initialData;

  const createMutation = useMutation({
    ...createInternshipMutation,
    onSuccess: () => {
      toast.success('Praktikplats skapad!');
      router.push('/dashboard/listings');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte skapa praktikplats.');
    }
  });

  const updateMutation = useMutation({
    ...updateInternshipMutation,
    onSuccess: () => {
      toast.success('Praktikplats uppdaterad!');
      router.push('/dashboard/listings');
    },
    onError: () => {
      toast.error('Kunde inte uppdatera praktikplats.');
    }
  });

  const form = useAppForm({
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      responsibilities: initialData?.responsibilities ?? '',
      requirements: initialData?.requirements ?? '',
      preferredQualifications: initialData?.preferredQualifications ?? '',
      field: initialData?.field ?? '',
      internshipType: initialData?.internshipType ?? 'lia',
      city: initialData?.city ?? '',
      workplaceType: initialData?.workplaceType ?? 'on_site',
      duration: initialData?.duration ?? '',
      spots: initialData?.spots ?? 1,
      startDate: initialData?.startDate ?? '',
      applicationDeadline: initialData?.applicationDeadline ?? '',
      applicationMethod: initialData?.applicationMethod ?? 'platform',
      contactEmail: initialData?.contactEmail ?? '',
      cvRequired: initialData?.cvRequired ?? true,
      coverLetterRequired: initialData?.coverLetterRequired ?? false,
      screeningQuestions: initialData?.screeningQuestions ?? [],
      educationLevel: initialData?.educationLevel ?? '',
      rejectionMessage: initialData?.rejectionMessage ?? ''
    } as InternshipFormValues,
    validators: {
      onSubmit: internshipSchema
    },
    onSubmit: ({ value }) => {
      if (isEdit) {
        updateMutation.mutate({ id: initialData.$id, data: value });
      } else {
        createMutation.mutate({ companyId, data: value });
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<InternshipFormValues>();

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            <FormTextField
              name='title'
              label='Titel'
              required
              placeholder='Frontend-utvecklare LIA'
              validators={{
                onBlur: z.string().min(5, 'Titel måste vara minst 5 tecken.')
              }}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormSelectField
                name='field'
                label='Område'
                required
                options={fieldOptions}
                placeholder='Välj område'
                validators={{
                  onBlur: z.string().min(1, 'Välj ett område.')
                }}
              />

              <FormSelectField
                name='internshipType'
                label='Typ av praktik'
                required
                options={internshipTypeOptions}
                placeholder='Välj typ'
              />

              <FormTextField
                name='city'
                label='Stad'
                required
                placeholder='Stockholm'
                validators={{
                  onBlur: z.string().min(2, 'Stad måste vara minst 2 tecken.')
                }}
              />

              <FormTextField
                name='spots'
                label='Antal platser'
                required
                type='number'
                min={1}
                placeholder='1'
                validators={{
                  onBlur: z.number({ message: 'Antal platser krävs.' }).min(1, 'Minst 1 plats.')
                }}
              />

              <FormTextField name='duration' label='Varaktighet' placeholder='10 veckor' />

              <FormTextField name='startDate' label='Startdatum' placeholder='2025-08-18' />
            </div>

            <FormTextareaField
              name='description'
              label='Beskrivning'
              required
              placeholder='Beskriv praktikplatsen, arbetsuppgifter och vad praktikanten får lära sig...'
              maxLength={2000}
              rows={6}
              validators={{
                onBlur: z.string().min(30, 'Beskrivning måste vara minst 30 tecken.')
              }}
            />

            <FormTextareaField
              name='requirements'
              label='Krav'
              placeholder='Vilka förkunskaper eller kvalifikationer behövs? (valfritt)'
              maxLength={1000}
              rows={4}
            />

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => router.back()}>
                Avbryt
              </Button>
              <form.SubmitButton>
                {isEdit ? 'Spara ändringar' : 'Skapa praktikplats'}
              </form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
