'use client';

import { useState, useRef } from 'react';
import { useUser } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ROLE_LABELS, EDUCATION_LEVEL_LABELS, INTERNSHIP_TYPE_LABELS } from '@/types/platform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { companyProfileOptions, companyKeys } from '@/features/company/api/queries';
import { updateCompanyProfile, createCompanyProfile } from '@/features/company/api/service';
import { industryOptions } from '@/features/company/constants/options';
import { studentProfileOptions, studentKeys } from '@/features/profile/api/queries';
import {
  updateStudentProfile,
  uploadStudentCV,
  getStudentCVUrl,
  uploadAvatar,
  getAvatarUrl
} from '@/features/profile/api/service';
import {
  educationLevelOptions,
  internshipTypeOptions,
  popularSkills
} from '@/features/profile/constants/student-options';
import { getQueryClient } from '@/lib/query-client';
import type { CompanyProfile, CompanyProfilePayload } from '@/features/company/api/types';
import type { StudentProfileDoc, StudentProfilePayload } from '@/features/profile/api/types';

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

export default function ProfileViewPage() {
  const { profile, user, isLoading, refreshProfile } = useUser();
  const userId = profile?.userId ?? '';
  const isCompany = profile?.role === 'company';
  const isStudent = profile?.role === 'student';
  const [editing, setEditing] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { data: company, isLoading: companyLoading } = useQuery({
    ...companyProfileOptions(userId),
    enabled: !!userId && isCompany
  });

  const { data: studentProfile, isLoading: studentLoading } = useQuery({
    ...studentProfileOptions(userId),
    enabled: !!userId && isStudent
  });

  if (isLoading) {
    return (
      <div className='flex h-[50vh] items-center justify-center'>
        <Icons.spinner className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex w-full flex-col gap-6 p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profilinformation</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Avatar + Grundläggande info */}
          <div className='flex items-start gap-6'>
            {/* Avatar upload */}
            <div className='flex flex-col items-center gap-2'>
              <Avatar className='h-20 w-20 border-2'>
                <AvatarImage src={profile?.avatarUrl || ''} alt={profile?.displayName || ''} />
                <AvatarFallback className='text-lg font-semibold'>
                  {(profile?.displayName || '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || <Icons.user className='h-8 w-8' />}
                </AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type='file'
                accept='image/png,image/jpeg,image/webp'
                className='hidden'
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    toast.error('Bilden är för stor. Max 2 MB.');
                    return;
                  }
                  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
                    toast.error('Endast PNG, JPG eller WebP.');
                    return;
                  }
                  setUploadingAvatar(true);
                  try {
                    await uploadAvatar(file);
                    await refreshProfile();
                    toast.success('Profilbild uppdaterad!');
                  } catch (err) {
                    const msg =
                      err instanceof Error ? err.message : 'Kunde inte ladda upp profilbild.';
                    toast.error(msg);
                  } finally {
                    setUploadingAvatar(false);
                  }
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
                ) : (
                  <>
                    <Icons.upload className='mr-1.5 h-3.5 w-3.5' />
                    {profile?.avatarUrl ? 'Byt bild' : 'Ladda upp'}
                  </>
                )}
              </Button>
            </div>

            {/* Info fields */}
            <div className='grid flex-1 gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Namn</p>
                <p>{profile?.displayName || user?.name || '—'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>E-post</p>
                <p>{profile?.email || user?.email || '—'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Roll</p>
                <p>{profile?.role ? ROLE_LABELS[profile.role] : '—'}</p>
              </div>
              <div>
                <p className='text-muted-foreground text-sm font-medium'>Status</p>
                <p className='capitalize'>{profile?.status || '—'}</p>
              </div>
            </div>
          </div>

          {/* Företagsinformation */}
          {isCompany && (
            <div className='border-border border-t pt-6'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Företagsinformation</h3>
                {company && !editing && (
                  <Button variant='outline' size='sm' onClick={() => setEditing(true)}>
                    <Icons.edit className='mr-2 h-4 w-4' />
                    Redigera
                  </Button>
                )}
              </div>

              {companyLoading ? (
                <div className='flex items-center gap-2'>
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                  <span className='text-muted-foreground text-sm'>Laddar...</span>
                </div>
              ) : company && !editing ? (
                <CompanyInfoView company={company} />
              ) : company && editing ? (
                <CompanyInlineEdit
                  company={company}
                  onCancel={() => setEditing(false)}
                  onSaved={() => setEditing(false)}
                />
              ) : (
                <CompanyOnboardInline userId={userId} email={profile?.email ?? ''} />
              )}
            </div>
          )}

          {/* Studentprofil */}
          {isStudent && (
            <div className='border-border border-t pt-6'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Studentprofil</h3>
                {studentProfile && !editingStudent && (
                  <Button variant='outline' size='sm' onClick={() => setEditingStudent(true)}>
                    <Icons.edit className='mr-2 h-4 w-4' />
                    Redigera
                  </Button>
                )}
              </div>

              {studentLoading ? (
                <div className='flex items-center gap-2'>
                  <Icons.spinner className='h-4 w-4 animate-spin' />
                  <span className='text-muted-foreground text-sm'>Laddar...</span>
                </div>
              ) : studentProfile && !editingStudent ? (
                <StudentInfoView student={studentProfile} />
              ) : studentProfile && editingStudent ? (
                <StudentInlineEdit
                  student={studentProfile}
                  onCancel={() => setEditingStudent(false)}
                  onSaved={() => setEditingStudent(false)}
                />
              ) : (
                <div className='text-muted-foreground space-y-3 py-4 text-center'>
                  <p className='text-sm'>Du har inte skapat din studentprofil ännu.</p>
                  <Button asChild variant='outline' size='sm'>
                    <a href='/dashboard/onboarding'>Skapa profil</a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Visa-läge ─────────────────────────────────────────────────

function CompanyInfoView({ company }: { company: CompanyProfile }) {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <InfoField label='Företagsnamn' value={company.companyName} />
        <InfoField label='Org.nummer' value={company.orgNumber} />
        <InfoField label='Bransch' value={company.industry} />
        <InfoField label='Stad' value={company.city} />
        <InfoField label='Kontakt-e-post' value={company.contactEmail} />
        {company.contactPhone && <InfoField label='Telefon' value={company.contactPhone} />}
        {company.website && (
          <div>
            <p className='text-muted-foreground text-sm font-medium'>Webbplats</p>
            <a
              href={company.website}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline'
            >
              {company.website}
            </a>
          </div>
        )}
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Godkännandestatus</p>
          <Badge variant={APPROVAL_VARIANTS[company.approvalStatus] ?? 'secondary'}>
            {APPROVAL_LABELS[company.approvalStatus] ?? company.approvalStatus}
          </Badge>
        </div>
      </div>
      {company.description && (
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Beskrivning</p>
          <p className='text-sm'>{company.description}</p>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className='text-muted-foreground text-sm font-medium'>{label}</p>
      <p>{value || '—'}</p>
    </div>
  );
}

// ─── Redigera inline ───────────────────────────────────────────

function CompanyInlineEdit({
  company,
  onCancel,
  onSaved
}: {
  company: CompanyProfile;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CompanyProfilePayload>({
    companyName: company.companyName ?? '',
    orgNumber: company.orgNumber ?? '',
    industry: company.industry ?? '',
    description: company.description ?? '',
    website: company.website ?? '',
    city: company.city ?? '',
    contactEmail: company.contactEmail ?? '',
    contactPhone: company.contactPhone ?? ''
  });

  const mutation = useMutation({
    mutationFn: (data: CompanyProfilePayload) => updateCompanyProfile(company.$id, data),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: companyKeys.all });
      toast.success('Företagsprofil uppdaterad!');
      onSaved();
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte spara.');
    }
  });

  const handleSave = () => {
    if (
      !form.companyName ||
      !form.orgNumber ||
      !form.industry ||
      !form.city ||
      !form.contactEmail
    ) {
      toast.error('Fyll i alla obligatoriska fält.');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <CompanyFormFields
      form={form}
      setForm={setForm}
      isPending={mutation.isPending}
      onSave={handleSave}
      onCancel={onCancel}
      submitLabel='Spara'
    />
  );
}

// ─── Skapa företag (inline) ────────────────────────────────────

function CompanyOnboardInline({ userId, email }: { userId: string; email: string }) {
  const [form, setForm] = useState<CompanyProfilePayload>({
    companyName: '',
    orgNumber: '',
    industry: '',
    description: '',
    website: '',
    city: '',
    contactEmail: email,
    contactPhone: ''
  });

  const mutation = useMutation({
    mutationFn: (data: CompanyProfilePayload) => createCompanyProfile(userId, data),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: companyKeys.all });
      toast.success('Företagsprofil skapad!');
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte skapa företagsprofil.');
    }
  });

  const handleSave = () => {
    if (
      !form.companyName ||
      !form.orgNumber ||
      !form.industry ||
      !form.city ||
      !form.contactEmail ||
      !form.description
    ) {
      toast.error('Fyll i alla obligatoriska fält.');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <>
      <p className='text-muted-foreground mb-4 text-sm'>
        Fyll i dina företagsuppgifter nedan för att registrera ditt företag.
      </p>
      <CompanyFormFields
        form={form}
        setForm={setForm}
        isPending={mutation.isPending}
        onSave={handleSave}
        submitLabel='Registrera företag'
      />
    </>
  );
}

// ─── Gemensamma formulärfält ───────────────────────────────────

function CompanyFormFields({
  form,
  setForm,
  isPending,
  onSave,
  onCancel,
  submitLabel
}: {
  form: CompanyProfilePayload;
  setForm: (v: CompanyProfilePayload) => void;
  isPending: boolean;
  onSave: () => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <EditField
          label='Företagsnamn'
          value={form.companyName}
          required
          onChange={(v) => setForm({ ...form, companyName: v })}
        />
        <EditField
          label='Org.nummer'
          value={form.orgNumber}
          required
          placeholder='XXXXXX-XXXX'
          onChange={(v) => setForm({ ...form, orgNumber: v })}
        />
        <div className='space-y-2'>
          <Label>
            Bransch <span className='text-destructive'>*</span>
          </Label>
          <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
            <SelectTrigger>
              <SelectValue placeholder='Välj bransch' />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <EditField
          label='Stad'
          value={form.city}
          required
          onChange={(v) => setForm({ ...form, city: v })}
        />
        <EditField
          label='Kontakt-e-post'
          value={form.contactEmail}
          required
          onChange={(v) => setForm({ ...form, contactEmail: v })}
        />
        <EditField
          label='Telefon'
          value={form.contactPhone ?? ''}
          onChange={(v) => setForm({ ...form, contactPhone: v })}
        />
        <div className='space-y-2 sm:col-span-2'>
          <EditField
            label='Webbplats'
            value={form.website ?? ''}
            placeholder='https://www.foretag.se'
            onChange={(v) => setForm({ ...form, website: v })}
          />
        </div>
      </div>
      <div className='space-y-2'>
        <Label>
          Beskrivning <span className='text-destructive'>*</span>
        </Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          placeholder='Beskriv ert företag, verksamhet och vad ni erbjuder praktikanter...'
        />
      </div>
      <div className='flex justify-end gap-2'>
        {onCancel && (
          <Button variant='outline' size='sm' onClick={onCancel} disabled={isPending}>
            Avbryt
          </Button>
        )}
        <Button size='sm' onClick={onSave} disabled={isPending}>
          {isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  required,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className='space-y-2'>
      <Label>
        {label} {required && <span className='text-destructive'>*</span>}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Student Profile Components
// ═══════════════════════════════════════════════════════════════

// ─── Visa-läge ─────────────────────────────────────────────────

function StudentInfoView({ student }: { student: StudentProfileDoc }) {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2'>
        <InfoField label='Skola' value={student.school} />
        <InfoField label='Program' value={student.program} />
        <InfoField
          label='Utbildningsnivå'
          value={EDUCATION_LEVEL_LABELS[student.educationLevel] ?? student.educationLevel}
        />
        <InfoField label='Stad' value={student.city} />
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Praktiktyp</p>
          <div className='mt-1 flex flex-wrap gap-1'>
            {student.internshipType.map((t) => (
              <Badge key={t} variant='secondary'>
                {INTERNSHIP_TYPE_LABELS[t] ?? t}
              </Badge>
            ))}
          </div>
        </div>
        {student.linkedinUrl && (
          <div>
            <p className='text-muted-foreground text-sm font-medium'>LinkedIn</p>
            <a
              href={student.linkedinUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:underline'
            >
              {student.linkedinUrl}
            </a>
          </div>
        )}
      </div>
      {student.skills.length > 0 && (
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Kompetenser</p>
          <div className='mt-1 flex flex-wrap gap-1'>
            {student.skills.map((skill) => (
              <Badge key={skill} variant='outline'>
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {student.bio && (
        <div>
          <p className='text-muted-foreground text-sm font-medium'>Bio</p>
          <p className='text-sm'>{student.bio}</p>
        </div>
      )}
      {student.cvFileId && (
        <div>
          <p className='text-muted-foreground text-sm font-medium'>CV</p>
          <a
            href={getStudentCVUrl(student.cvFileId)}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
          >
            <Icons.fileTypePdf className='h-4 w-4' />
            Visa CV
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Redigera inline ───────────────────────────────────────────

function StudentInlineEdit({
  student,
  onCancel,
  onSaved
}: {
  student: StudentProfileDoc;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StudentProfilePayload>({
    school: student.school ?? '',
    program: student.program ?? '',
    educationLevel: student.educationLevel ?? 'yh',
    internshipType: student.internshipType ?? [],
    city: student.city ?? '',
    skills: student.skills ?? [],
    bio: student.bio ?? '',
    linkedinUrl: student.linkedinUrl ?? '',
    cvFileId: student.cvFileId ?? ''
  });

  const mutation = useMutation({
    mutationFn: (data: StudentProfilePayload) => updateStudentProfile(student.$id, data),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: studentKeys.all });
      toast.success('Studentprofil uppdaterad!');
      onSaved();
    },
    onError: (error) => {
      toast.error(error.message || 'Kunde inte spara.');
    }
  });

  const handleSave = () => {
    if (!form.school || !form.program || !form.city || !form.bio) {
      toast.error('Fyll i alla obligatoriska fält.');
      return;
    }
    if (form.internshipType.length === 0) {
      toast.error('Välj minst en typ av praktik.');
      return;
    }
    if (form.skills.length === 0) {
      toast.error('Lägg till minst en kompetens.');
      return;
    }
    mutation.mutate(form);
  };

  return (
    <StudentFormFields
      form={form}
      setForm={setForm}
      isPending={mutation.isPending}
      onSave={handleSave}
      onCancel={onCancel}
      submitLabel='Spara'
    />
  );
}

// ─── Gemensamma studentfält ────────────────────────────────────

function StudentFormFields({
  form,
  setForm,
  isPending,
  onSave,
  onCancel,
  submitLabel
}: {
  form: StudentProfilePayload;
  setForm: (v: StudentProfilePayload) => void;
  isPending: boolean;
  onSave: () => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [customSkill, setCustomSkill] = useState('');

  const handleToggleType = (value: string) => {
    const types = form.internshipType as string[];
    const next = types.includes(value) ? types.filter((t) => t !== value) : [...types, value];
    setForm({ ...form, internshipType: next as StudentProfilePayload['internshipType'] });
  };

  const handleToggleSkill = (skill: string) => {
    const next = form.skills.includes(skill)
      ? form.skills.filter((s) => s !== skill)
      : [...form.skills, skill];
    setForm({ ...form, skills: next });
  };

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm({ ...form, skills: [...form.skills, trimmed] });
      setCustomSkill('');
    }
  };

  const handleCVUpload = async (file: File) => {
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
      setForm({ ...form, cvFileId: fileId });
      toast.success('CV uppladdat!');
    } catch {
      toast.error('Kunde inte ladda upp CV.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Utbildning */}
      <div className='space-y-4'>
        <h4 className='flex items-center gap-2 text-sm font-semibold'>
          <Icons.school className='h-4 w-4' />
          Utbildning
        </h4>
        <div className='grid gap-4 sm:grid-cols-2'>
          <EditField
            label='Skola'
            value={form.school}
            required
            placeholder='T.ex. Jensen Yrkeshögskola'
            onChange={(v) => setForm({ ...form, school: v })}
          />
          <EditField
            label='Program'
            value={form.program}
            required
            placeholder='T.ex. Mjukvaruutvecklare .NET'
            onChange={(v) => setForm({ ...form, program: v })}
          />
          <div className='space-y-2'>
            <Label>
              Utbildningsnivå <span className='text-destructive'>*</span>
            </Label>
            <Select
              value={form.educationLevel}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  educationLevel: v as StudentProfilePayload['educationLevel']
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Välj nivå' />
              </SelectTrigger>
              <SelectContent>
                {educationLevelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <EditField
            label='Stad'
            value={form.city}
            required
            placeholder='T.ex. Stockholm'
            onChange={(v) => setForm({ ...form, city: v })}
          />
        </div>
      </div>

      {/* Praktiktyp */}
      <div className='space-y-3'>
        <Label>
          Typ av praktik <span className='text-destructive'>*</span>
        </Label>
        <div className='flex flex-wrap gap-2'>
          {internshipTypeOptions.map((opt) => {
            const isSelected = (form.internshipType as string[]).includes(opt.value);
            return (
              <button
                key={opt.value}
                type='button'
                onClick={() => handleToggleType(opt.value)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-muted border-input'
                }`}
              >
                {isSelected ? (
                  <Icons.check className='h-3 w-3' />
                ) : (
                  <Icons.add className='h-3 w-3' />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div className='space-y-4'>
        <h4 className='flex items-center gap-2 text-sm font-semibold'>
          <Icons.user className='h-4 w-4' />
          Om dig
        </h4>
        <div className='space-y-2'>
          <Label>
            Bio <span className='text-destructive'>*</span>
          </Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={5}
            placeholder='Berätta kort om dig själv, dina intressen och vad du vill lära dig under praktiken...'
          />
        </div>
        <EditField
          label='LinkedIn'
          value={form.linkedinUrl ?? ''}
          placeholder='https://www.linkedin.com/in/ditt-namn'
          onChange={(v) => setForm({ ...form, linkedinUrl: v })}
        />
      </div>

      {/* Kompetenser */}
      <div className='space-y-3'>
        <h4 className='flex items-center gap-2 text-sm font-semibold'>
          <Icons.briefcase className='h-4 w-4' />
          Kompetenser <span className='text-destructive'>*</span>
        </h4>

        {/* Selected */}
        {form.skills.length > 0 && (
          <div className='flex flex-wrap gap-1.5'>
            {form.skills.map((skill) => (
              <button
                key={skill}
                type='button'
                onClick={() => handleToggleSkill(skill)}
                className='bg-primary text-primary-foreground border-primary inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors'
              >
                {skill}
                <Icons.close className='h-3 w-3' />
              </button>
            ))}
          </div>
        )}

        {/* Popular skills */}
        <div>
          <p className='text-muted-foreground mb-2 text-xs'>Populära kompetenser:</p>
          <div className='flex flex-wrap gap-1.5'>
            {popularSkills
              .filter((s) => !form.skills.includes(s))
              .slice(0, 20)
              .map((skill) => (
                <button
                  key={skill}
                  type='button'
                  onClick={() => handleToggleSkill(skill)}
                  className='bg-background hover:bg-muted border-input inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors'
                >
                  <Icons.add className='h-2.5 w-2.5' />
                  {skill}
                </button>
              ))}
          </div>
        </div>

        {/* Custom skill */}
        <div className='flex gap-2'>
          <Input
            value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomSkill();
              }
            }}
            placeholder='Lägg till egen kompetens...'
            className='flex-1'
          />
          <Button type='button' variant='outline' size='sm' onClick={handleAddCustomSkill}>
            <Icons.add className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* CV */}
      <div className='space-y-3'>
        <h4 className='flex items-center gap-2 text-sm font-semibold'>
          <Icons.upload className='h-4 w-4' />
          CV <span className='text-muted-foreground text-xs font-normal'>(valfritt)</span>
        </h4>
        {form.cvFileId ? (
          <div className='bg-muted flex items-center gap-3 rounded-lg p-3'>
            <Icons.fileTypePdf className='h-5 w-5 shrink-0' />
            <div className='min-w-0 flex-1'>
              <a
                href={getStudentCVUrl(form.cvFileId)}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary text-sm hover:underline'
              >
                Visa CV
              </a>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => setForm({ ...form, cvFileId: '' })}
            >
              <Icons.trash className='h-4 w-4' />
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
              <Icons.upload className='text-muted-foreground h-6 w-6' />
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
            if (file) handleCVUpload(file);
          }}
        />
      </div>

      {/* Actions */}
      <div className='flex justify-end gap-2'>
        {onCancel && (
          <Button variant='outline' size='sm' onClick={onCancel} disabled={isPending}>
            Avbryt
          </Button>
        )}
        <Button size='sm' onClick={onSave} disabled={isPending}>
          {isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
