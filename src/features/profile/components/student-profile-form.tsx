'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { createStudentMutation, updateStudentMutation } from '../api/mutations';
import { uploadStudentCV, getStudentCVUrl } from '../api/service';
import type { StudentProfileDoc } from '../api/types';
import { studentProfileSchema, type StudentProfileFormValues } from '../schemas/student-profile';
import {
  educationLevelOptions,
  internshipTypeOptions,
  popularSkills
} from '../constants/student-options';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState, useRef } from 'react';
import * as z from 'zod';

// ─── PascalCase icon aliases ───────────────────────────────────

const SchoolIcon = Icons.school;
const UserIcon = Icons.user;
const BriefcaseIcon = Icons.briefcase;
const CheckIcon = Icons.check;
const AddIcon = Icons.add;
const InfoIcon = Icons.info;
const UploadIcon = Icons.upload;
const TrashIcon = Icons.trash;
const CloseIcon = Icons.close;

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

// ─── Internship Type Tags ─────────────────────────────────────

function InternshipTypeTags({
  selected,
  onToggle
}: Readonly<{
  selected: string[];
  onToggle: (value: string) => void;
}>) {
  return (
    <div className='flex flex-wrap gap-2'>
      {internshipTypeOptions.map((opt) => {
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

// ─── Skill Tags ───────────────────────────────────────────────

function SkillTags({
  selected,
  onToggle,
  onAddCustom
}: Readonly<{
  selected: string[];
  onToggle: (value: string) => void;
  onAddCustom: (value: string) => void;
}>) {
  const [customSkill, setCustomSkill] = useState('');

  const handleAddCustom = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onAddCustom(trimmed);
      setCustomSkill('');
    }
  };

  return (
    <div className='space-y-3'>
      {/* Selected skills */}
      {selected.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {selected.map((skill) => (
            <button
              key={skill}
              type='button'
              onClick={() => onToggle(skill)}
              className='bg-primary text-primary-foreground border-primary inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors'
            >
              {skill}
              <CloseIcon className='h-3 w-3' />
            </button>
          ))}
        </div>
      )}

      {/* Popular skills to add */}
      <div>
        <p className='text-muted-foreground mb-2 text-xs'>Populära kompetenser:</p>
        <div className='flex flex-wrap gap-1.5'>
          {popularSkills
            .filter((s) => !selected.includes(s))
            .slice(0, 20)
            .map((skill) => (
              <button
                key={skill}
                type='button'
                onClick={() => onToggle(skill)}
                className='bg-background hover:bg-muted border-input inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors'
              >
                <AddIcon className='h-2.5 w-2.5' />
                {skill}
              </button>
            ))}
        </div>
      </div>

      {/* Custom skill input */}
      <div className='flex gap-2'>
        <input
          type='text'
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder='Lägg till egen kompetens...'
          className='border-input bg-background placeholder:text-muted-foreground flex h-9 flex-1 rounded-md border px-3 text-sm'
        />
        <Button type='button' variant='outline' size='sm' onClick={handleAddCustom}>
          <AddIcon className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

// ─── CV Upload ────────────────────────────────────────────────

function CVUploadField({
  cvFileId,
  onFileUploaded,
  onRemove
}: Readonly<{
  cvFileId?: string;
  onFileUploaded: (fileId: string) => void;
  onRemove: () => void;
}>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen är för stor. Max 10 MB.');
      return;
    }
    if (file.type !== 'application/pdf') {
      toast.error('Endast PDF-filer är tillåtna.');
      return;
    }
    setUploading(true);
    try {
      const fileId = await uploadStudentCV(file);
      onFileUploaded(fileId);
      toast.success('CV uppladdat!');
    } catch {
      toast.error('Kunde inte ladda upp CV.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium'>
        CV <span className='text-muted-foreground'>(valfritt)</span>
      </p>
      {cvFileId ? (
        <div className='bg-muted flex items-center gap-3 rounded-lg p-3'>
          <Icons.fileTypePdf className='h-5 w-5 shrink-0' />
          <div className='min-w-0 flex-1'>
            <a
              href={getStudentCVUrl(cvFileId)}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary text-sm hover:underline'
            >
              Visa CV
            </a>
          </div>
          <Button type='button' variant='ghost' size='sm' onClick={onRemove}>
            <TrashIcon className='h-4 w-4' />
          </Button>
        </div>
      ) : (
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className='border-input hover:bg-muted flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors'
        >
          {uploading ? (
            <Icons.spinner className='h-6 w-6 animate-spin' />
          ) : (
            <UploadIcon className='text-muted-foreground h-6 w-6' />
          )}
          <div className='text-center'>
            <p className='text-sm font-medium'>{uploading ? 'Laddar upp...' : 'Ladda upp CV'}</p>
            <p className='text-muted-foreground text-xs'>PDF, max 10 MB</p>
          </div>
        </button>
      )}
      <input
        ref={fileInputRef}
        type='file'
        accept='application/pdf'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
    </div>
  );
}

// ─── Sidebar Summary Card ─────────────────────────────────────

const EDUCATION_LABELS: Record<string, string> = {
  yh: 'Yrkeshögskola',
  university: 'Universitet/Högskola',
  gymnasie: 'Gymnasie',
  other: 'Övrigt'
};

function SidebarSummary({
  values,
  isEdit
}: Readonly<{
  values: StudentProfileFormValues;
  isEdit: boolean;
}>) {
  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-start gap-3'>
          <div className='bg-muted flex h-10 w-10 items-center justify-center rounded-lg'>
            <UserIcon className='h-5 w-5' />
          </div>
          <div className='min-w-0 flex-1'>
            <CardTitle className='truncate text-sm font-semibold'>
              {values.school || 'Din skola'}
            </CardTitle>
            <p className='text-muted-foreground text-xs'>{values.program || 'Ditt program'}</p>
            <p className='text-muted-foreground text-xs'>
              {values.city || 'Stad'}
              {values.educationLevel && `, ${EDUCATION_LABELS[values.educationLevel] ?? ''}`}
            </p>
            {values.skills.length > 0 && (
              <p className='text-muted-foreground mt-1 text-xs'>
                {values.skills.length} kompetens{values.skills.length !== 1 ? 'er' : ''}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// ─── Sidebar Tips Card ────────────────────────────────────────

function SidebarTips() {
  const tips = [
    'En komplett profil ökar dina chanser att hittas av företag.',
    'Lägg till relevanta kompetenser för bättre matchning.',
    'Ladda upp ditt CV för att snabba upp ansökningsprocessen.',
    'Ange rätt stad så kan företag i ditt område hitta dig.'
  ];

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex items-center gap-2'>
          <InfoIcon className='h-4 w-4' />
          <CardTitle className='text-sm font-semibold'>Tips för din profil</CardTitle>
        </div>
        <CardDescription className='text-xs'>
          En välutfylld profil gör att du matchar bättre med relevanta praktikplatser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className='text-muted-foreground space-y-2.5 text-sm'>
          {tips.map((tip) => (
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

// ─── Main Component ───────────────────────────────────────────

interface StudentProfileFormProps {
  initialData: StudentProfileDoc | null;
  userId: string;
  userName: string;
  userEmail: string;
}

export default function StudentProfileForm({
  initialData,
  userId,
  userName,
  userEmail
}: Readonly<StudentProfileFormProps>) {
  const router = useRouter();
  const isEdit = !!initialData;

  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? []);
  const [internshipTypes, setInternshipTypes] = useState<string[]>(
    initialData?.internshipType ?? []
  );
  const [cvFileId, setCvFileId] = useState<string | undefined>(initialData?.cvFileId ?? undefined);

  const createMutation = useMutation({
    ...createStudentMutation,
    onSuccess: () => {
      toast.success('Studentprofil skapad!');
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte skapa profil.');
    }
  });

  const updateMutation = useMutation({
    ...updateStudentMutation,
    onSuccess: () => {
      toast.success('Profil uppdaterad!');
      router.push('/dashboard/profile');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte uppdatera profil.');
    }
  });

  const form = useAppForm({
    defaultValues: {
      school: initialData?.school ?? '',
      program: initialData?.program ?? '',
      educationLevel: initialData?.educationLevel ?? 'yh',
      internshipType: initialData?.internshipType ?? [],
      city: initialData?.city ?? '',
      skills: initialData?.skills ?? [],
      bio: initialData?.bio ?? '',
      linkedinUrl: initialData?.linkedinUrl ?? '',
      cvFileId: initialData?.cvFileId ?? ''
    } as StudentProfileFormValues,
    validators: {
      onSubmit: studentProfileSchema
    },
    onSubmit: ({ value }) => {
      const payload = {
        ...value,
        skills,
        internshipType: internshipTypes as ('lia' | 'vfu' | 'apl')[],
        cvFileId: cvFileId ?? ''
      };
      if (isEdit) {
        updateMutation.mutate({ id: initialData.$id, data: payload });
      } else {
        createMutation.mutate({ userId, data: payload });
      }
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } =
    useFormFields<StudentProfileFormValues>();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleToggleInternshipType = (value: string) => {
    setInternshipTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleToggleSkill = (value: string) => {
    setSkills((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleAddCustomSkill = (value: string) => {
    setSkills((prev) => [...prev, value]);
  };

  return (
    <form.AppForm>
      <form.Form className='space-y-0'>
        {/* ── Header ── */}
        <div className='mb-6'>
          <p className='text-muted-foreground text-sm'>
            Fyll i din studentprofil nedan för att börja söka praktikplatser.
          </p>
          <p className='text-muted-foreground mt-0.5 text-xs'>* Obligatoriskt fält</p>
        </div>

        {/* ── Two-column layout: Main + Sidebar ── */}
        <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-3'>
          {/* ══════════════════════════════════════ */}
          {/* MAIN CONTENT — 2/3 width              */}
          {/* ══════════════════════════════════════ */}
          <div className='space-y-6 lg:col-span-2'>
            {/* Section: Utbildning */}
            <Card>
              <CardHeader>
                <SectionHeader
                  icon={SchoolIcon}
                  title='Utbildning'
                  description='Berätta om din skola och ditt program.'
                />
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                  <FormTextField
                    name='school'
                    label='Skola'
                    required
                    placeholder='T.ex. Jensen Yrkeshögskola'
                    validators={{
                      onBlur: z.string().min(2, 'Skola måste vara minst 2 tecken.')
                    }}
                  />

                  <FormTextField
                    name='program'
                    label='Program'
                    required
                    placeholder='T.ex. Mjukvaruutvecklare .NET'
                    validators={{
                      onBlur: z.string().min(2, 'Program måste vara minst 2 tecken.')
                    }}
                  />
                </div>

                <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                  <FormSelectField
                    name='educationLevel'
                    label='Utbildningsnivå'
                    required
                    options={educationLevelOptions}
                    placeholder='Välj nivå'
                  />

                  <FormTextField
                    name='city'
                    label='Stad'
                    required
                    placeholder='T.ex. Stockholm'
                    validators={{
                      onBlur: z.string().min(2, 'Stad måste vara minst 2 tecken.')
                    }}
                  />
                </div>

                {/* Internship type tags */}
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>
                    Typ av praktik <span className='text-destructive'>*</span>
                  </p>
                  <p className='text-muted-foreground text-xs'>
                    Välj vilka typer av praktik du söker.
                  </p>
                  <InternshipTypeTags
                    selected={internshipTypes}
                    onToggle={handleToggleInternshipType}
                  />
                  {internshipTypes.length === 0 && (
                    <p className='text-destructive text-xs'>Välj minst en typ av praktik.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section: Om dig */}
            <Card>
              <CardHeader>
                <SectionHeader
                  icon={UserIcon}
                  title='Om dig'
                  description='Beskriv dig själv och dina mål.'
                />
              </CardHeader>
              <CardContent className='space-y-6'>
                <FormTextareaField
                  name='bio'
                  label='Bio'
                  required
                  placeholder='Berätta kort om dig själv, dina intressen och vad du vill lära dig under praktiken...'
                  maxLength={2000}
                  rows={6}
                  validators={{
                    onBlur: z.string().min(10, 'Bio måste vara minst 10 tecken.')
                  }}
                />

                <FormTextField
                  name='linkedinUrl'
                  label='LinkedIn'
                  placeholder='https://www.linkedin.com/in/ditt-namn'
                />
              </CardContent>
            </Card>

            {/* Section: Kompetenser */}
            <Card>
              <CardHeader>
                <SectionHeader
                  icon={BriefcaseIcon}
                  title='Kompetenser'
                  description='Lägg till dina tekniska och andra kompetenser för bättre matchning.'
                />
              </CardHeader>
              <CardContent>
                <SkillTags
                  selected={skills}
                  onToggle={handleToggleSkill}
                  onAddCustom={handleAddCustomSkill}
                />
                {skills.length === 0 && (
                  <p className='text-destructive mt-2 text-xs'>Lägg till minst en kompetens.</p>
                )}
              </CardContent>
            </Card>

            {/* Section: CV */}
            <Card>
              <CardHeader>
                <SectionHeader
                  icon={UploadIcon}
                  title='CV'
                  description='Ladda upp ditt CV för att snabba upp ansökningsprocessen.'
                />
              </CardHeader>
              <CardContent>
                <CVUploadField
                  cvFileId={cvFileId}
                  onFileUploaded={(fileId) => setCvFileId(fileId)}
                  onRemove={() => setCvFileId(undefined)}
                />
              </CardContent>
            </Card>
          </div>

          {/* ══════════════════════════════════════ */}
          {/* SIDEBAR — 1/3 width                   */}
          {/* ══════════════════════════════════════ */}
          <div className='space-y-6 lg:sticky lg:top-20'>
            <form.Subscribe selector={(state) => state.values}>
              {(values) => <SidebarSummary values={values} isEdit={isEdit} />}
            </form.Subscribe>

            <SidebarTips />
          </div>
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* STICKY ACTION BAR                             */}
        {/* ══════════════════════════════════════════════ */}
        <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-10 -mx-4 mt-8 border-t px-4 py-4 backdrop-blur md:-mx-6 md:px-6'>
          <div className='flex items-center justify-end'>
            <div className='flex items-center gap-3'>
              <Button
                type='button'
                variant='outline'
                disabled={isPending}
                onClick={() => router.back()}
              >
                Avbryt
              </Button>

              <Button type='submit' disabled={isPending} isLoading={isPending}>
                {isEdit ? 'Spara ändringar' : 'Spara profil'}
              </Button>
            </div>
          </div>
        </div>
      </form.Form>
    </form.AppForm>
  );
}
