'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { createInternshipMutation, updateInternshipMutation } from '../api/mutations';
import type { Internship } from '../api/types';
import {
  internshipStep1Schema,
  internshipStep2Schema,
  internshipSchema,
  type InternshipFormValues
} from '../schemas/internship';
import {
  fieldOptions,
  internshipTypeOptions,
  workplaceTypeOptions,
  applicationMethodOptions,
  educationLevelOptions,
  screeningQuestionOptions
} from '@/features/company/constants/options';
import { useFormStepper } from '@/hooks/use-stepper';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import * as z from 'zod';

// ─── PascalCase icon aliases ───────────────────────────────────

const AddIcon = Icons.add;
const BriefcaseIcon = Icons.briefcase;
const PostIcon = Icons.post;
const MailIcon = Icons.mail;
const CheckIcon = Icons.check;
const InfoIcon = Icons.info;
const SearchIcon = Icons.search;
const UserIcon = Icons.user;

// ─── Workplace type labels ─────────────────────────────────────

const WORKPLACE_LABELS: Record<string, string> = {
  on_site: 'På plats',
  remote: 'Distans',
  hybrid: 'Hybrid'
};

const TYPE_LABELS: Record<string, string> = {
  lia: 'LIA',
  vfu: 'VFU',
  apl: 'APL'
};

// ─── Section Header (reused pattern) ──────────────────────────

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

// ─── Screening Question Tags ──────────────────────────────────

function ScreeningQuestionTags({
  selected,
  onToggle
}: Readonly<{
  selected: string[];
  onToggle: (value: string) => void;
}>) {
  return (
    <div className='flex flex-wrap gap-2'>
      {screeningQuestionOptions.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type='button'
            onClick={() => onToggle(opt.value)}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              isSelected
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-input'
            }`}
          >
            {isSelected ? (
              <span className='text-primary-foreground'>
                <CheckIcon className='h-3 w-3' />
              </span>
            ) : (
              <AddIcon className='h-3 w-3' />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sidebar Summary Card ─────────────────────────────────────

function SidebarSummary({
  values,
  companyName,
  companyCity,
  isEdit
}: Readonly<{
  values: InternshipFormValues;
  companyName: string;
  companyCity: string;
  isEdit: boolean;
}>) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start gap-3'>
          <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-lg'>
            <BriefcaseIcon className='h-5 w-5' />
          </div>
          <div className='min-w-0 flex-1'>
            <CardTitle className='truncate text-sm font-semibold'>
              {values.title || 'Praktiktitel'}
            </CardTitle>
            <p className='text-muted-foreground text-xs'>{companyName}</p>
            <p className='text-muted-foreground text-xs'>
              {values.city || companyCity}
              {values.workplaceType && `, ${WORKPLACE_LABELS[values.workplaceType] ?? ''}`}
            </p>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              Spara som <span className='font-semibold'>{'utkast'}</span>
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// ─── Sidebar Tips Card ────────────────────────────────────────

function SidebarTips({
  currentStep
}: Readonly<{
  currentStep: number;
}>) {
  const step1Tips = [
    'En tydlig och specifik titel attraherar rätt kandidater.',
    'Beskriv arbetsuppgifter och lärandemål utförligt.',
    'Ange korrekt stad och arbetsplatstyp för bättre matchning.'
  ];

  const step2Tips = [
    'Kontrollfrågor är riktade till sökande som matchar dina krav.',
    'Sätt upp automatiskt avslag för att effektivisera processen.',
    'Ange en kontaktperson så sökande vet vem de pratar med.'
  ];

  const tips = currentStep === 1 ? step1Tips : step2Tips;
  const title =
    currentStep === 1
      ? 'Målinrikta ditt jobb på rätt personer'
      : 'Varför ska du använda kontrollfrågor?';
  const subtitle =
    currentStep === 1
      ? 'Infoga en arbetsbeskrivning och lägg till obligatoriska kompetenser hos jobbsökande som matchar dina kriterier.'
      : 'Din platsannons är riktad till personer som matchar dina krav och du kommer att meddelas om sökande som klarar kontrollfrågor.';

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-2'>
          <InfoIcon className='h-4 w-4' />
          <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
        </div>
        <CardDescription className='text-xs'>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className='text-muted-foreground space-y-2.5 text-sm'>
          {tips.map((tip, i) => (
            <li key={tip} className='flex gap-2'>
              <span className='mt-0.5 shrink-0'>
                <CheckIcon className='h-3.5 w-3.5' />
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── Submit button label helper ───────────────────────────────

function getSubmitLabel(isCompleted: boolean, isEdit: boolean): string {
  if (!isCompleted) return 'Nästa';
  return isEdit ? 'Spara ändringar' : 'Publicera';
}

// ─── Main Component ───────────────────────────────────────────

interface InternshipCreateFormProps {
  initialData: Internship | null;
  companyId: string;
  companyName: string;
  companyCity: string;
  contactEmail: string;
}

export default function InternshipCreateForm({
  initialData,
  companyId,
  companyName,
  companyCity,
  contactEmail
}: Readonly<InternshipCreateFormProps>) {
  const router = useRouter();
  const isEdit = !!initialData;

  const stepper = useFormStepper([internshipStep1Schema, internshipStep2Schema]);
  const [screeningQuestions, setScreeningQuestions] = useState<string[]>(
    initialData?.screeningQuestions ?? []
  );

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
    onError: (error) => {
      toast.error(error.message || 'Kunde inte uppdatera praktikplats.');
    }
  });

  const form = useAppForm({
    defaultValues: {
      // Step 1
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      responsibilities: initialData?.responsibilities ?? '',
      requirements: initialData?.requirements ?? '',
      preferredQualifications: initialData?.preferredQualifications ?? '',
      field: initialData?.field ?? '',
      internshipType: initialData?.internshipType ?? 'lia',
      city: initialData?.city ?? companyCity,
      workplaceType: initialData?.workplaceType ?? 'on_site',
      duration: initialData?.duration ?? '',
      spots: initialData?.spots ?? 1,
      startDate: initialData?.startDate ?? '',
      applicationDeadline: initialData?.applicationDeadline ?? '',
      // Step 2
      applicationMethod: initialData?.applicationMethod ?? 'email',
      contactEmail: initialData?.contactEmail ?? contactEmail,
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
      const payload = {
        ...value,
        screeningQuestions
      };
      if (isEdit) {
        updateMutation.mutate({ id: initialData.$id, data: payload });
      } else {
        createMutation.mutate({ companyId, data: payload });
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField, FormCheckboxField } =
    useFormFields<InternshipFormValues>();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleToggleScreening = (value: string) => {
    setScreeningQuestions((prev) =>
      prev.includes(value) ? prev.filter((q) => q !== value) : [...prev, value]
    );
  };

  return (
    <form.AppForm>
      <form.Form className='space-y-0'>
        {/* ── Step indicator ── */}
        <div className='mb-6'>
          <p className='text-muted-foreground text-sm'>
            <span className='text-foreground font-medium'>
              {stepper.currentStep} av {stepper.step.count}
            </span>
            {': '}
            {stepper.currentStep === 1 ? 'Berätta för oss om rollen' : 'Få kvalificerade sökande'}
          </p>
          <p className='text-muted-foreground mt-0.5 text-xs'>* Obligatoriskt fält</p>
        </div>

        {/* ── Two-column layout: Main + Sidebar ── */}
        <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-3'>
          {/* ══════════════════════════════════════ */}
          {/* MAIN CONTENT — 2/3 width              */}
          {/* ══════════════════════════════════════ */}
          <div className='space-y-6 lg:col-span-2'>
            {/* ───────────────────────────────────── */}
            {/* STEP 1: Berätta om rollen             */}
            {/* ───────────────────────────────────── */}
            {stepper.currentStep === 1 && (
              <>
                {/* Section: Grundläggande */}
                <Card>
                  <CardHeader>
                    <SectionHeader
                      icon={BriefcaseIcon}
                      title='Grundläggande'
                      description='Titel, typ och plats för praktikplatsen.'
                    />
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <FormTextField
                      name='title'
                      label='Titel'
                      required
                      placeholder='T.ex. Frontend-utvecklare LIA'
                      validators={{
                        onBlur: z.string().min(5, 'Titel måste vara minst 5 tecken.')
                      }}
                    />

                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                      <FormSelectField
                        name='internshipType'
                        label='Typ av praktik'
                        required
                        options={internshipTypeOptions}
                        placeholder='Välj typ'
                      />

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

                      <FormTextField
                        name='city'
                        label='Stad'
                        required
                        placeholder='Stockholm'
                        validators={{
                          onBlur: z.string().min(2, 'Stad måste vara minst 2 tecken.')
                        }}
                      />

                      <FormSelectField
                        name='workplaceType'
                        label='Arbetsplatstyp'
                        required
                        options={workplaceTypeOptions}
                        placeholder='Välj typ'
                      />
                    </div>

                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-3'>
                      <FormTextField
                        name='duration'
                        label='Varaktighet'
                        placeholder='T.ex. 10 veckor'
                      />

                      <FormTextField
                        name='spots'
                        label='Antal platser'
                        required
                        type='number'
                        min={1}
                        placeholder='1'
                        validators={{
                          onBlur: z
                            .number({ message: 'Antal platser krävs.' })
                            .min(1, 'Minst 1 plats.')
                        }}
                      />

                      <FormTextField name='startDate' label='Startdatum' placeholder='ÅÅÅÅ-MM-DD' />
                    </div>

                    <FormTextField
                      name='applicationDeadline'
                      label='Sista ansökningsdag'
                      placeholder='ÅÅÅÅ-MM-DD'
                    />
                  </CardContent>
                </Card>

                {/* Section: Beskrivning */}
                <Card>
                  <CardHeader>
                    <SectionHeader
                      icon={PostIcon}
                      title='Beskrivning'
                      description='Beskriv rollen, arbetsuppgifter och krav.'
                    />
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <FormTextareaField
                      name='description'
                      label='Beskrivning'
                      required
                      placeholder='Beskriv praktikplatsen, vad praktikanten får arbeta med och lära sig...'
                      maxLength={10000}
                      rows={8}
                      validators={{
                        onBlur: z.string().min(30, 'Beskrivning måste vara minst 30 tecken.')
                      }}
                    />

                    <FormTextareaField
                      name='responsibilities'
                      label='Ansvarsområden'
                      placeholder='• Utveckla och underhålla frontend-komponenter&#10;• Delta i kodgranskningar&#10;• Samarbeta med design-teamet'
                      maxLength={3000}
                      rows={5}
                    />

                    <FormTextareaField
                      name='requirements'
                      label='Krav'
                      placeholder='• Pågående utbildning inom relevant område&#10;• Grundläggande kunskaper i JavaScript/TypeScript&#10;• Goda kunskaper i svenska och engelska'
                      maxLength={3000}
                      rows={5}
                    />

                    <FormTextareaField
                      name='preferredQualifications'
                      label='Meriterande'
                      placeholder='• Erfarenhet av React eller liknande ramverk&#10;• Intresse för UX/UI&#10;• Portfölj med egna projekt'
                      maxLength={2000}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* ───────────────────────────────────── */}
            {/* STEP 2: Få kvalificerade sökande      */}
            {/* ───────────────────────────────────── */}
            {stepper.currentStep === 2 && (
              <>
                {/* Section: Insamling av sökande */}
                <Card>
                  <CardHeader>
                    <SectionHeader
                      icon={MailIcon}
                      title='Insamling av sökande'
                      description='Hur vill du ta emot ansökningar?'
                    />
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                      <FormSelectField
                        name='applicationMethod'
                        label='Få sökande'
                        required
                        options={applicationMethodOptions}
                        placeholder='Välj metod'
                        validators={{
                          onBlur: z.string().min(1, 'Välj insamlingsmetod.')
                        }}
                      />

                      <FormTextField
                        name='contactEmail'
                        label='E-postadress'
                        required
                        placeholder='rekrytering@foretag.se'
                        validators={{
                          onBlur: z.string().min(1, 'E-postadress krävs.')
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Section: Screeningfrågor */}
                <Card>
                  <CardHeader>
                    <SectionHeader
                      icon={SearchIcon}
                      title='Screeningfrågor'
                      description='Vi rekommenderar att du lägger till minst tre frågor. De sökande måste svara på alla frågor.'
                    />
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    {/* Utbildningsnivå */}
                    <FormSelectField
                      name='educationLevel'
                      label='Utbildningsnivå'
                      options={educationLevelOptions}
                      placeholder='Välj utbildningsnivå'
                    />

                    {/* Screening question tags */}
                    <div className='space-y-2'>
                      <p className='text-sm font-medium'>Lägg till kontrollfrågor:</p>
                      <ScreeningQuestionTags
                        selected={screeningQuestions}
                        onToggle={handleToggleScreening}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Section: Inställningar för kvalifikationer */}
                <Card>
                  <CardHeader>
                    <SectionHeader
                      icon={UserIcon}
                      title='Inställningar för kvalifikationer'
                      description='Konfigurera krav på ansökningshandlingar och avslag.'
                    />
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <FormCheckboxField
                      name='cvRequired'
                      label='CV krävs'
                      description='Sökande måste bifoga sitt CV.'
                    />

                    <FormCheckboxField
                      name='coverLetterRequired'
                      label='Personligt brev krävs'
                      description='Sökande måste bifoga ett personligt brev.'
                    />

                    <FormTextareaField
                      name='rejectionMessage'
                      label='Förhandsgranska avslagsmeddelande'
                      placeholder='Tack för visat intresse för tjänsten. Tyvärr har vi valt att inte gå vidare med din ansökan...'
                      maxLength={3000}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* ══════════════════════════════════════ */}
          {/* SIDEBAR — 1/3 width                   */}
          {/* ══════════════════════════════════════ */}
          <div className='space-y-6 lg:sticky lg:top-20'>
            <form.Subscribe selector={(state) => state.values}>
              {(values) => (
                <SidebarSummary
                  values={values}
                  companyName={companyName}
                  companyCity={companyCity}
                  isEdit={isEdit}
                />
              )}
            </form.Subscribe>

            <SidebarTips currentStep={stepper.currentStep} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* STICKY ACTION BAR                             */}
        {/* ══════════════════════════════════════════════ */}
        <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 -mx-4 mt-8 border-t px-4 py-4 backdrop-blur md:-mx-6 md:px-6'>
          <div className='flex items-center justify-between'>
            {/* Left side: Preview link */}
            <Button
              type='button'
              variant='link'
              className='px-0'
              onClick={() => toast.info('Förhandsgranskning kommer snart.')}
            >
              Förhandsgranska
            </Button>

            {/* Right side: Back + Next/Submit */}
            <div className='flex items-center gap-3'>
              <Button
                type='button'
                variant='outline'
                disabled={isPending}
                onClick={() =>
                  stepper.handleCancelOrBack({
                    onCancel: () => router.back(),
                    onBack: () => {} // stepper handles goToPrevStep
                  })
                }
              >
                {stepper.isFirstStep ? 'Avbryt' : 'Tillbaka'}
              </Button>

              <Button
                type='button'
                disabled={isPending}
                isLoading={isPending && stepper.step.isCompleted}
                onClick={() => stepper.handleNextStepOrSubmit(form)}
              >
                {getSubmitLabel(stepper.step.isCompleted, isEdit)}
              </Button>
            </div>
          </div>
        </div>
      </form.Form>
    </form.AppForm>
  );
}
