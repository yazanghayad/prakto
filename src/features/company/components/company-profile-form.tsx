'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { createCompanyMutation, updateCompanyMutation } from '../api/mutations';
import type { CompanyProfile } from '../api/types';
import { companyProfileSchema, type CompanyProfileFormValues } from '../schemas/company-profile';
import { industryOptions } from '../constants/options';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-auth';
import { toast } from 'sonner';
import * as z from 'zod';

// ─── PascalCase icon aliases (ESLint jsx-pascal-case) ──────────

const CheckIcon = Icons.check;
const CircleIcon = Icons.circle;
const CircleCheckIcon = Icons.circleCheck;
const InfoIcon = Icons.info;
const BuildingIcon = Icons.building;
const PostIcon = Icons.post;
const MailIcon = Icons.mail;

// ─── Approval status labels & variants ─────────────────────────

const APPROVAL_LABELS: Record<string, string> = {
  pending: 'Väntar på granskning',
  approved: 'Godkänd',
  rejected: 'Avvisad'
};

const APPROVAL_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive'
};

// ─── Section Header ────────────────────────────────────────────

function SectionHeader({
  icon: IconComponent,
  title,
  description
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}>) {
  return (
    <div className='flex items-start gap-3'>
      <div className='bg-muted flex h-9 w-9 shrink-0 items-center justify-center rounded-lg'>
        <IconComponent className='h-4 w-4' />
      </div>
      <div className='space-y-0.5'>
        <h3 className='text-base font-semibold leading-none'>{title}</h3>
        {description && <p className='text-muted-foreground text-sm'>{description}</p>}
      </div>
    </div>
  );
}

// ─── Profile Completeness ──────────────────────────────────────

function ProfileCompleteness({
  values
}: Readonly<{
  values: CompanyProfileFormValues;
}>) {
  const fields = [
    { key: 'companyName', label: 'Företagsnamn' },
    { key: 'orgNumber', label: 'Org.nummer' },
    { key: 'industry', label: 'Bransch' },
    { key: 'city', label: 'Stad' },
    { key: 'contactEmail', label: 'E-post' },
    { key: 'description', label: 'Beskrivning' },
    { key: 'website', label: 'Webbplats' },
    { key: 'contactPhone', label: 'Telefon' }
  ] as const;

  const filled = fields.filter((f) => {
    const val = values[f.key];
    return val && String(val).trim().length > 0;
  }).length;
  const total = fields.length;
  const percentage = Math.round((filled / total) * 100);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between text-sm'>
        <span className='text-muted-foreground'>Profil komplett</span>
        <span className='font-medium'>{percentage}%</span>
      </div>
      <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
        <div
          className='bg-primary h-full rounded-full transition-all duration-300'
          style={{ width: `${percentage}%` }}
        />
      </div>
      <ul className='space-y-1.5'>
        {fields.map((f) => {
          const val = values[f.key];
          const done = val && String(val).trim().length > 0;
          return (
            <li key={f.key} className='flex items-center gap-2 text-sm'>
              {done ? (
                <span className='text-primary'>
                  <CircleCheckIcon className='h-3.5 w-3.5' />
                </span>
              ) : (
                <span className='text-muted-foreground'>
                  <CircleIcon className='h-3.5 w-3.5' />
                </span>
              )}
              <span className={done ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main Form Component ───────────────────────────────────────

interface CompanyProfileFormProps {
  initialData: CompanyProfile | null;
  pageTitle?: string;
}

export default function CompanyProfileForm({
  initialData,
  pageTitle
}: Readonly<CompanyProfileFormProps>) {
  const router = useRouter();
  const { profile } = useUser();
  const isEdit = !!initialData;

  const createMutation = useMutation({
    ...createCompanyMutation,
    onSuccess: () => {
      toast.success('Företagsprofil skapad!');
      router.push('/dashboard/listings');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte skapa företagsprofil.');
    }
  });

  const updateMutation = useMutation({
    ...updateCompanyMutation,
    onSuccess: () => {
      toast.success('Företagsprofil uppdaterad!');
      router.push('/dashboard/listings');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte uppdatera företagsprofil.');
    }
  });

  const form = useAppForm({
    defaultValues: {
      companyName: initialData?.companyName ?? '',
      orgNumber: initialData?.orgNumber ?? '',
      industry: initialData?.industry ?? '',
      description: initialData?.description ?? '',
      website: initialData?.website ?? '',
      city: initialData?.city ?? '',
      contactEmail: initialData?.contactEmail ?? profile?.email ?? '',
      contactPhone: initialData?.contactPhone ?? ''
    } as CompanyProfileFormValues,
    validators: {
      onSubmit: companyProfileSchema
    },
    onSubmit: ({ value }) => {
      if (isEdit) {
        updateMutation.mutate({ id: initialData.$id, data: value });
      } else {
        createMutation.mutate({
          userId: profile?.userId ?? '',
          data: value
        });
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<CompanyProfileFormValues>();

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form.AppForm>
      <form.Form className='space-y-0'>
        {/* ── Two-column layout: Main + Sidebar ── */}
        <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-3'>
          {/* ══════════════════════════════════════ */}
          {/* MAIN CONTENT — 2/3 width              */}
          {/* ══════════════════════════════════════ */}
          <div className='space-y-6 lg:col-span-2'>
            {/* ── Section 1: Grunduppgifter ── */}
            <Card>
              <CardHeader>
                <SectionHeader
                  icon={BuildingIcon}
                  title='Grunduppgifter'
                  description='Grundläggande information om ditt företag.'
                />
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                  <FormTextField
                    name='companyName'
                    label='Företagsnamn'
                    required
                    placeholder='AB Exempel'
                    validators={{
                      onBlur: z.string().min(2, 'Företagsnamn måste vara minst 2 tecken.')
                    }}
                  />

                  <FormTextField
                    name='orgNumber'
                    label='Organisationsnummer'
                    required
                    placeholder='XXXXXX-XXXX'
                    validators={{
                      onBlur: z.string().min(10, 'Organisationsnummer måste vara minst 10 tecken.')
                    }}
                  />

                  <FormSelectField
                    name='industry'
                    label='Bransch'
                    required
                    options={industryOptions}
                    placeholder='Välj bransch'
                    validators={{
                      onBlur: z.string().min(1, 'Välj en bransch.')
                    }}
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
                </div>
              </CardContent>
            </Card>

            {/* ── Section 2: Om företaget ── */}
            <Card>
              <CardHeader>
                <SectionHeader
                  icon={PostIcon}
                  title='Om företaget'
                  description='Berätta mer om ert företag och verksamhet.'
                />
              </CardHeader>
              <CardContent className='space-y-6'>
                <FormTextareaField
                  name='description'
                  label='Beskrivning'
                  required
                  placeholder='Beskriv ert företag, verksamhet och vad ni erbjuder praktikanter...'
                  maxLength={1000}
                  rows={5}
                  validators={{
                    onBlur: z.string().min(20, 'Beskrivning måste vara minst 20 tecken.')
                  }}
                />

                <FormTextField
                  name='website'
                  label='Webbplats'
                  placeholder='https://www.foretag.se'
                />
              </CardContent>
            </Card>

            {/* ── Section 3: Kontaktuppgifter ── */}
            <Card>
              <CardHeader>
                <SectionHeader
                  icon={MailIcon}
                  title='Kontaktuppgifter'
                  description='Kontaktinformation som visas för studenter och administratörer.'
                />
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                  <FormTextField
                    name='contactEmail'
                    label='Kontakt e-post'
                    required
                    placeholder='info@foretag.se'
                    validators={{
                      onBlur: z.string().email('Ange en giltig e-postadress.')
                    }}
                  />

                  <FormTextField name='contactPhone' label='Telefon' placeholder='070-123 45 67' />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ══════════════════════════════════════ */}
          {/* SIDEBAR — 1/3 width                   */}
          {/* ══════════════════════════════════════ */}
          <div className='space-y-6 lg:sticky lg:top-20'>
            {/* ── Profile Status ── */}
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-semibold'>Profilstatus</CardTitle>
                {isEdit && initialData?.approvalStatus && (
                  <CardDescription>
                    <Badge variant={APPROVAL_VARIANTS[initialData.approvalStatus] ?? 'secondary'}>
                      {APPROVAL_LABELS[initialData.approvalStatus] ?? initialData.approvalStatus}
                    </Badge>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <form.Subscribe selector={(state) => state.values}>
                  {(values) => <ProfileCompleteness values={values} />}
                </form.Subscribe>
              </CardContent>
            </Card>

            {/* ── Tips & Guidelines ── */}
            <Card>
              <CardHeader>
                <CardTitle className='text-sm font-semibold'>
                  <div className='flex items-center gap-2'>
                    <InfoIcon className='h-4 w-4' />
                    {'Tips'}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='text-muted-foreground space-y-3 text-sm'>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 shrink-0'>
                      <CheckIcon className='h-3.5 w-3.5' />
                    </span>
                    <span>
                      En utförlig beskrivning ökar chansen att attrahera kvalificerade praktikanter.
                    </span>
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 shrink-0'>
                      <CheckIcon className='h-3.5 w-3.5' />
                    </span>
                    <span>Ange en giltig webbplats så att studenter kan lära sig mer om er.</span>
                  </li>
                  <li className='flex gap-2'>
                    <span className='mt-0.5 shrink-0'>
                      <CheckIcon className='h-3.5 w-3.5' />
                    </span>
                    <span>
                      Er profil granskas av en administratör innan ni kan publicera praktikplatser.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* STICKY ACTION BAR                             */}
        {/* ══════════════════════════════════════════════ */}
        <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 -mx-4 mt-8 border-t px-4 py-4 backdrop-blur md:-mx-6 md:px-6'>
          <div className='flex items-center justify-end gap-3'>
            {isEdit && (
              <Button
                type='button'
                variant='outline'
                onClick={() => router.back()}
                disabled={isPending}
              >
                Avbryt
              </Button>
            )}
            <form.SubmitButton>
              {isEdit ? 'Spara ändringar' : 'Registrera företag'}
            </form.SubmitButton>
          </div>
        </div>
      </form.Form>
    </form.AppForm>
  );
}
