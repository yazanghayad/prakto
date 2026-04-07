'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-auth';
import { onboardStudent, uploadAvatar, uploadStudentCV, getAvatarUrl } from '../api/service';
import {
  educationLevelOptions,
  internshipTypeOptions,
  popularSkills
} from '../constants/student-options';
import { studentKeys } from '../api/queries';
import { getQueryClient } from '@/lib/query-client';
import type { StudentOnboardingPayload } from '../api/types';
import type { EducationLevel, InternshipType } from '@/types/platform';

// ─── Constants ────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const STEP_TITLES = [
  'Skapa ditt konto',
  'Din skola',
  'Anpassa din upplevelse',
  'Profilbild & CV',
  'Kompetenser',
  'CV & Dokument'
];

const STEP_DESCRIPTIONS = [
  'Fyll i ditt namn för att komma igång.',
  'Ange din skola och utbildning.',
  'Välj utbildningstyp och var du söker praktik så vi kan matcha dig bättre.',
  'Ladda upp din profilbild och ditt CV så fyller vi i resten åt dig.',
  'Vilka kompetenser har du?',
  'Sista steget — kontaktuppgifter och LinkedIn.'
];

// ─── Types ────────────────────────────────────────────────────

interface OnboardingState {
  // Step 1 — Name
  firstName: string;
  lastName: string;
  // Step 2 — Personal info
  displayName: string;
  email: string;
  phone: string;
  avatarFileId: string;
  avatarPreviewUrl: string;
  // Step 3 — Education
  school: string;
  program: string;
  educationLevel: EducationLevel;
  internshipType: InternshipType[];
  city: string;
  // Step 4 — Skills
  skills: string[];
  bio: string;
  // Step 5 — CV
  cvFileId: string;
  cvFileName: string;
  linkedinUrl: string;
}

// ─── Component ────────────────────────────────────────────────

export function StudentOnboardingWizard() {
  const router = useRouter();
  const { profile, refreshProfile } = useUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingState>({
    firstName: profile?.displayName?.split(' ')[0] ?? '',
    lastName: profile?.displayName?.split(' ').slice(1).join(' ') ?? '',
    displayName: profile?.displayName ?? '',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    avatarFileId: '',
    avatarPreviewUrl: '',
    school: '',
    program: '',
    educationLevel: 'yh',
    internshipType: [],
    city: '',
    skills: [],
    bio: '',
    cvFileId: '',
    cvFileName: '',
    linkedinUrl: ''
  });

  const [customSkill, setCustomSkill] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [analyzingCV, setAnalyzingCV] = useState(false);
  const [cvAnalyzed, setCvAnalyzed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mutation = useMutation({
    mutationFn: (data: StudentOnboardingPayload) => onboardStudent(data),
    onSuccess: async () => {
      getQueryClient().invalidateQueries({ queryKey: studentKeys.all });
      await refreshProfile();
      toast.success('Profil skapad! Välkommen till Prakto.');
      router.push('/dashboard/overview');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte slutföra registreringen.');
    }
  });

  // ─── Handlers ───────────────────────────────────────────────

  const update = useCallback(
    <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Bilden är för stor. Max 2 MB.');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast.error('Endast PNG, JPG eller WebP-format.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const fileId = await uploadAvatar(file);
      const previewUrl = getAvatarUrl(fileId);
      setForm((prev) => ({ ...prev, avatarFileId: fileId, avatarPreviewUrl: previewUrl }));
      toast.success('Profilbild uppladdad!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kunde inte ladda upp profilbild.';
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCVUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen är för stor. Max 10 MB.');
      return;
    }
    if (file.type !== 'application/pdf') {
      toast.error('Endast PDF-filer.');
      return;
    }
    setUploadingCV(true);
    try {
      const fileId = await uploadStudentCV(file);
      setForm((prev) => ({ ...prev, cvFileId: fileId, cvFileName: file.name }));
      toast.success('CV uppladdat! Analyserar...');

      // Analyze the CV with AI
      setAnalyzingCV(true);
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const res = await fetch('/api/ai/analyze-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId }),
          credentials: 'include',
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            ...prev,
            skills: data.skills?.length ? data.skills : prev.skills,
            bio: data.bio || prev.bio,
            linkedinUrl: data.linkedinUrl || prev.linkedinUrl,
            phone: data.phone || prev.phone,
            email: data.email || prev.email
          }));
          setCvAnalyzed(true);
          toast.success('CV analyserat! Vi har fyllt i dina kompetenser.');
        } else {
          toast.info('Kunde inte analysera CV:t automatiskt. Fyll i manuellt.');
        }
      } catch {
        toast.info('CV-analys misslyckades. Du kan fylla i manuellt istället.');
      } finally {
        setAnalyzingCV(false);
      }
    } catch {
      toast.error('Kunde inte ladda upp CV.');
    } finally {
      setUploadingCV(false);
    }
  };

  const toggleInternshipType = (value: string) => {
    const types = form.internshipType as string[];
    const next = types.includes(value) ? types.filter((t) => t !== value) : [...types, value];
    update('internshipType', next as InternshipType[]);
  };

  const toggleSkill = (skill: string) => {
    const next = form.skills.includes(skill)
      ? form.skills.filter((s) => s !== skill)
      : [...form.skills, skill];
    update('skills', next);
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      update('skills', [...form.skills, trimmed]);
      setCustomSkill('');
    }
  };

  // ─── Validation ─────────────────────────────────────────────

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 1:
        if (!form.firstName.trim()) return 'Ange ditt förnamn.';
        if (!form.lastName.trim()) return 'Ange ditt efternamn.';
        break;
      case 2:
        if (!form.school.trim()) return 'Ange din skola.';
        if (!form.program.trim()) return 'Ange ditt program.';
        break;
      case 3:
        if (!form.city.trim()) return 'Ange din stad.';
        if (form.internshipType.length === 0) return 'Välj minst en typ av praktik.';
        break;
      case 4:
        // Profile pic & CV — optional, no validation needed
        break;
      case 5:
        if (form.skills.length === 0) return 'Lägg till minst en kompetens.';
        if (form.bio.trim().length < 10) return 'Skriv en kort beskrivning (minst 10 tecken).';
        break;
      case 6:
        if (!form.email.trim()) return 'Ange din e-postadress.';
        if (!form.phone.trim()) return 'Ange ditt telefonnummer.';
        break;
    }
    return null;
  };

  const goNext = () => {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = () => {
    const payload: StudentOnboardingPayload = {
      displayName: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      avatarFileId: form.avatarFileId || undefined,
      school: form.school.trim(),
      program: form.program.trim(),
      educationLevel: form.educationLevel,
      internshipType: form.internshipType,
      city: form.city.trim(),
      skills: form.skills,
      bio: form.bio.trim(),
      linkedinUrl: form.linkedinUrl.trim() || undefined,
      cvFileId: form.cvFileId || undefined
    };
    mutation.mutate(payload);
  };

  // ─── Render ─────────────────────────────────────────────────

  if (!mounted) return null;

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex'>
      {/* ─── LEFT: Form ─────────────────────────────────── */}
      <div className='bg-background flex flex-1 flex-col overflow-y-auto'>
        {/* Logo */}
        <div className='px-8 py-6'>
          <Image src='/logo-dark.png' alt='Prakto' width={120} height={40} className='h-8 w-auto' />
        </div>

        {/* Form area — vertically centered */}
        <div className='flex flex-1 items-center justify-center px-6 pb-16'>
          <div className='w-full max-w-[420px]'>
            {/* Title */}
            <h1 className='text-[28px] leading-tight font-semibold tracking-tight'>
              {STEP_TITLES[step - 1]}
            </h1>
            <p className='text-muted-foreground mt-2 mb-8 text-[15px]'>
              {STEP_DESCRIPTIONS[step - 1]}
            </p>

            {/* Card with form fields */}
            <div className='space-y-5 rounded-xl border p-6'>
              {step === 1 && <NameStep form={form} update={update} />}
              {step === 2 && <SchoolStep form={form} update={update} />}
              {step === 3 && (
                <EducationStep
                  form={form}
                  update={update}
                  toggleInternshipType={toggleInternshipType}
                />
              )}
              {step === 4 && (
                <ProfileUploadStep
                  form={form}
                  update={update}
                  uploadingAvatar={uploadingAvatar}
                  uploadingCV={uploadingCV}
                  analyzingCV={analyzingCV}
                  cvAnalyzed={cvAnalyzed}
                  avatarInputRef={avatarInputRef}
                  cvInputRef={cvInputRef}
                  onAvatarUpload={handleAvatarUpload}
                  onCVUpload={handleCVUpload}
                />
              )}
              {step === 5 && (
                <SkillsStep
                  form={form}
                  update={update}
                  toggleSkill={toggleSkill}
                  customSkill={customSkill}
                  setCustomSkill={setCustomSkill}
                  addCustomSkill={addCustomSkill}
                  cvAnalyzed={cvAnalyzed}
                />
              )}
              {step === 6 && <ContactStep form={form} update={update} />}

              {/* Action button */}
              {step < TOTAL_STEPS ? (
                <Button className='w-full' onClick={goNext}>
                  Fortsätt
                </Button>
              ) : (
                <Button className='w-full' onClick={handleSubmit} isLoading={mutation.isPending}>
                  Slutför registrering
                </Button>
              )}
            </div>

            {/* Back / Skip links */}
            <div className='mt-4 flex items-center justify-between'>
              {step > 1 ? (
                <button
                  type='button'
                  onClick={goBack}
                  disabled={mutation.isPending}
                  className='text-muted-foreground hover:text-foreground text-sm transition-colors'
                >
                  ← Tillbaka
                </button>
              ) : (
                <div />
              )}
              {step === TOTAL_STEPS && !mutation.isPending && (
                <button
                  type='button'
                  onClick={handleSubmit}
                  className='text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline'
                >
                  Hoppa över
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom step indicator */}
        <div className='text-muted-foreground border-t px-8 py-4 text-sm'>
          Steg {step} av {TOTAL_STEPS}
        </div>
      </div>

      {/* ─── RIGHT: Branded panel ───────────────────────── */}
      <div className='bg-primary relative hidden w-[480px] flex-col items-center justify-center overflow-hidden lg:flex'>
        {/* Decorative blobs */}
        <div className='absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/5' />
        <div className='absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/5' />
        <div className='absolute top-1/2 left-1/3 h-48 w-48 -translate-y-1/2 rounded-full bg-white/[0.03]' />

        {/* Content */}
        <div className='text-primary-foreground relative z-10 px-12 text-center'>
          <div className='mb-8 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm'>
            <Icons.school className='h-10 w-10' />
          </div>
          <h2 className='text-2xl font-semibold'>Hitta din dröm-LIA</h2>
          <p className='text-primary-foreground/70 mt-3 max-w-xs leading-relaxed'>
            Prakto matchar dig med företag som letar efter just dina kompetenser.
          </p>

          {/* Feature checklist */}
          <div className='mt-10 space-y-4 text-left'>
            {[
              'Skapa din profil på minuter',
              'Smart matchning med företag',
              'Följ dina ansökningar i realtid'
            ].map((text) => (
              <div key={text} className='flex items-center gap-3'>
                <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15'>
                  <Icons.check className='h-3.5 w-3.5' />
                </div>
                <span className='text-primary-foreground/80 text-sm'>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step dots */}
        <div className='absolute bottom-8 flex gap-2'>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i + 1 === step
                  ? 'bg-primary-foreground w-6'
                  : i + 1 < step
                    ? 'bg-primary-foreground/60 w-2'
                    : 'bg-primary-foreground/25 w-2'
              )}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Step 1: Name ─────────────────────────────────────────────

function NameStep({
  form,
  update
}: {
  form: OnboardingState;
  update: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
}) {
  return (
    <>
      <div className='space-y-2'>
        <Label htmlFor='firstName'>Förnamn</Label>
        <Input
          id='firstName'
          placeholder='Jordan'
          value={form.firstName}
          onChange={(e) => {
            update('firstName', e.target.value);
            update('displayName', `${e.target.value} ${form.lastName}`.trim());
          }}
          autoFocus
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='lastName'>Efternamn</Label>
        <Input
          id='lastName'
          placeholder='Quinn'
          value={form.lastName}
          onChange={(e) => {
            update('lastName', e.target.value);
            update('displayName', `${form.firstName} ${e.target.value}`.trim());
          }}
        />
      </div>
    </>
  );
}

// ─── Step 2: School ───────────────────────────────────────────

function SchoolStep({
  form,
  update
}: {
  form: OnboardingState;
  update: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
}) {
  return (
    <>
      <div className='space-y-2'>
        <Label htmlFor='school'>Skolans namn</Label>
        <Input
          id='school'
          placeholder='T.ex. Jensen Yrkeshögskola'
          value={form.school}
          onChange={(e) => update('school', e.target.value)}
          autoFocus
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='program'>Utbildning / Program</Label>
        <Input
          id='program'
          placeholder='T.ex. Mjukvaruutvecklare .NET'
          value={form.program}
          onChange={(e) => update('program', e.target.value)}
        />
      </div>
    </>
  );
}

// ─── Step 4: Profile Upload (Avatar + CV + AI Analysis) ──────

function ProfileUploadStep({
  form,
  update,
  uploadingAvatar,
  uploadingCV,
  analyzingCV,
  cvAnalyzed,
  avatarInputRef,
  cvInputRef,
  onAvatarUpload,
  onCVUpload
}: {
  form: OnboardingState;
  update: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  uploadingAvatar: boolean;
  uploadingCV: boolean;
  analyzingCV: boolean;
  cvAnalyzed: boolean;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  cvInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarUpload: (file: File) => Promise<void>;
  onCVUpload: (file: File) => Promise<void>;
}) {
  const initials = `${form.firstName?.[0] ?? ''}${form.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className='space-y-6'>
      {/* Avatar */}
      <div className='flex items-center gap-4'>
        <Avatar className='h-16 w-16 border-2'>
          <AvatarImage src={form.avatarPreviewUrl} alt={form.displayName} />
          <AvatarFallback className='text-sm font-semibold'>
            {initials || <Icons.user className='h-6 w-6' />}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <p className='text-sm font-medium'>Profilbild</p>
          <p className='text-muted-foreground text-xs'>PNG, JPG eller WebP. Max 2 MB.</p>
        </div>
        <input
          ref={avatarInputRef}
          type='file'
          accept='image/png,image/jpeg,image/webp'
          className='hidden'
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onAvatarUpload(file);
          }}
        />
        <Button
          variant='outline'
          size='sm'
          onClick={() => avatarInputRef.current?.click()}
          disabled={uploadingAvatar}
        >
          {uploadingAvatar ? (
            <Icons.spinner className='h-4 w-4 animate-spin' />
          ) : form.avatarPreviewUrl ? (
            'Byt'
          ) : (
            'Ladda upp'
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className='border-t' />

      {/* CV Upload */}
      <div className='space-y-3'>
        <div>
          <p className='text-sm font-medium'>CV</p>
          <p className='text-muted-foreground text-xs'>
            Ladda upp ditt CV så analyserar vi det och fyller i kompetenser åt dig.
          </p>
        </div>
        <input
          ref={cvInputRef}
          type='file'
          accept='application/pdf'
          className='hidden'
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onCVUpload(file);
          }}
        />
        {form.cvFileId ? (
          <div className='bg-muted/50 flex items-center gap-3 rounded-lg border p-4'>
            <div className='bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg'>
              <Icons.fileTypePdf className='text-primary h-5 w-5' />
            </div>
            <div className='flex-1'>
              <p className='text-sm font-medium'>{form.cvFileName || 'CV.pdf'}</p>
              <p className='text-muted-foreground text-xs'>
                {analyzingCV
                  ? 'Analyserar CV med AI...'
                  : cvAnalyzed
                    ? 'Analyserad — kompetenser ifyllda'
                    : 'Uppladdad'}
              </p>
            </div>
            {analyzingCV ? (
              <Icons.spinner className='text-primary h-5 w-5 animate-spin' />
            ) : cvAnalyzed ? (
              <Icons.check className='text-primary h-5 w-5' />
            ) : (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  update('cvFileId', '');
                  update('cvFileName', '');
                }}
              >
                <Icons.trash className='h-4 w-4' />
              </Button>
            )}
          </div>
        ) : (
          <button
            type='button'
            onClick={() => cvInputRef.current?.click()}
            disabled={uploadingCV || analyzingCV}
            className={cn(
              'border-border hover:bg-muted/50 flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors',
              (uploadingCV || analyzingCV) && 'pointer-events-none opacity-60'
            )}
          >
            {uploadingCV ? (
              <Icons.spinner className='text-muted-foreground h-8 w-8 animate-spin' />
            ) : (
              <Icons.upload className='text-muted-foreground h-8 w-8' />
            )}
            <div className='text-center'>
              <p className='text-sm font-medium'>
                {uploadingCV ? 'Laddar upp...' : 'Klicka för att ladda upp CV'}
              </p>
              <p className='text-muted-foreground text-xs'>PDF-format, max 10 MB</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 3: Education ────────────────────────────────────────

function EducationStep({
  form,
  update,
  toggleInternshipType
}: {
  form: OnboardingState;
  update: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  toggleInternshipType: (value: string) => void;
}) {
  return (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <Label>
          Utbildningsnivå <span className='text-destructive'>*</span>
        </Label>
        <Select
          value={form.educationLevel}
          onValueChange={(v) => update('educationLevel', v as EducationLevel)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='z-[10000]'>
            {educationLevelOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='city'>
          Stad <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='city'
          placeholder='T.ex. Stockholm'
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
        />
      </div>

      <div className='space-y-2'>
        <Label>
          Typ av praktik <span className='text-destructive'>*</span>
        </Label>
        <p className='text-muted-foreground text-xs'>Välj en eller flera</p>
        <div className='flex flex-wrap gap-2'>
          {internshipTypeOptions.map((o) => {
            const active = form.internshipType.includes(o.value as InternshipType);
            return (
              <Badge
                key={o.value}
                variant={active ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer select-none px-3 py-1.5 text-sm transition-colors',
                  active && 'bg-primary text-primary-foreground'
                )}
                onClick={() => toggleInternshipType(o.value)}
              >
                {active && <Icons.check className='mr-1 h-3 w-3' />}
                {o.label}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Skills ───────────────────────────────────────────

function SkillsStep({
  form,
  update,
  toggleSkill,
  customSkill,
  setCustomSkill,
  addCustomSkill,
  cvAnalyzed
}: {
  form: OnboardingState;
  update: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
  toggleSkill: (skill: string) => void;
  customSkill: string;
  setCustomSkill: (v: string) => void;
  addCustomSkill: () => void;
  cvAnalyzed: boolean;
}) {
  return (
    <div className='space-y-5'>
      {cvAnalyzed && form.skills.length > 0 && (
        <div className='bg-primary/5 border-primary/20 flex items-start gap-2 rounded-lg border p-3'>
          <Icons.check className='text-primary mt-0.5 h-4 w-4 shrink-0' />
          <p className='text-sm'>
            Vi hittade <strong>{form.skills.length} kompetenser</strong> i ditt CV. Granska, lägg
            till eller ta bort nedan.
          </p>
        </div>
      )}
      <div className='space-y-2'>
        <Label>
          Kompetenser <span className='text-destructive'>*</span>
        </Label>
        <p className='text-muted-foreground text-xs'>
          Klicka för att välja. Du kan också lägga till egna.
        </p>
        <div className='flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-3'>
          {popularSkills.map((skill) => {
            const active = form.skills.includes(skill);
            return (
              <Badge
                key={skill}
                variant={active ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer select-none text-xs transition-colors',
                  active && 'bg-primary text-primary-foreground'
                )}
                onClick={() => toggleSkill(skill)}
              >
                {active && <Icons.check className='mr-0.5 h-3 w-3' />}
                {skill}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Custom skill */}
      <div className='flex gap-2'>
        <Input
          placeholder='Lägg till egen kompetens...'
          value={customSkill}
          onChange={(e) => setCustomSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustomSkill();
            }
          }}
        />
        <Button variant='outline' size='icon' onClick={addCustomSkill} type='button'>
          <Icons.add className='h-4 w-4' />
        </Button>
      </div>

      {/* Selected skills */}
      {form.skills.length > 0 && (
        <div className='space-y-1'>
          <p className='text-muted-foreground text-xs'>Valda ({form.skills.length}):</p>
          <div className='flex flex-wrap gap-1.5'>
            {form.skills.map((skill) => (
              <Badge
                key={skill}
                variant='secondary'
                className='cursor-pointer gap-1 pr-1.5'
                onClick={() => toggleSkill(skill)}
              >
                {skill}
                <Icons.close className='h-3 w-3' />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      <div className='space-y-2'>
        <Label htmlFor='bio'>
          Kort beskrivning <span className='text-destructive'>*</span>
        </Label>
        <Textarea
          id='bio'
          placeholder='Berätta kort om dig själv, dina mål och vad du vill lära dig under din praktik...'
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
          rows={4}
        />
        <p className='text-muted-foreground text-right text-xs'>{form.bio.length}/500</p>
      </div>
    </div>
  );
}

// ─── Step 5: CV ───────────────────────────────────────────────

// ─── Step 6: Contact Info ─────────────────────────────────────

function ContactStep({
  form,
  update
}: {
  form: OnboardingState;
  update: <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => void;
}) {
  return (
    <div className='space-y-5'>
      <div className='space-y-2'>
        <Label htmlFor='email'>
          Kontakt-e-post <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='email'
          type='email'
          placeholder='din@email.se'
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          autoFocus
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='phone'>
          Telefonnummer <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='phone'
          type='tel'
          placeholder='070-123 45 67'
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='linkedinUrl'>LinkedIn-profil (valfritt)</Label>
        <Input
          id='linkedinUrl'
          type='url'
          placeholder='https://linkedin.com/in/ditt-namn'
          value={form.linkedinUrl}
          onChange={(e) => update('linkedinUrl', e.target.value)}
        />
      </div>
    </div>
  );
}
