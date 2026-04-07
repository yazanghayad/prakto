// ============================================================
// Student Profile Service — Data Access Layer
// ============================================================
// All reads and writes go through server-side API routes
// which use the admin SDK (bypasses Appwrite permissions).
// ============================================================

import { apiUrl } from '@/lib/api-client';
import type { StudentProfileDoc, StudentProfilePayload, StudentOnboardingPayload } from './types';

/**
 * Get student profile by the authenticated user's ID.
 * Returns null if no profile exists yet (student hasn't onboarded).
 */
export async function getStudentProfile(userId: string): Promise<StudentProfileDoc | null> {
  const res = await fetch(apiUrl(`/api/students?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return null;
  const json = await res.json();
  return (json.profile as StudentProfileDoc) ?? null;
}

/**
 * Get student profile by document ID.
 */
export async function getStudentById(id: string): Promise<StudentProfileDoc> {
  const res = await fetch(apiUrl(`/api/students?id=${encodeURIComponent(id)}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta studentprofil.');
  }
  const json = await res.json();
  return json.profile as StudentProfileDoc;
}

/**
 * Create a new student profile (onboarding).
 */
export async function createStudentProfile(
  userId: string,
  data: StudentProfilePayload
): Promise<StudentProfileDoc> {
  const res = await fetch(apiUrl('/api/students'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skapa studentprofil.');
  }
  const json = await res.json();
  return json.profile as StudentProfileDoc;
}

/**
 * Update an existing student profile.
 */
export async function updateStudentProfile(
  id: string,
  data: Partial<StudentProfilePayload>
): Promise<StudentProfileDoc> {
  const res = await fetch(apiUrl('/api/students'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', studentId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera studentprofil.');
  }
  const json = await res.json();
  return json.profile as StudentProfileDoc;
}

/**
 * Upload CV to Appwrite storage via server-side API.
 * Returns the file ID.
 */
export async function uploadStudentCV(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', 'cvs');
  const res = await fetch(apiUrl('/api/upload'), {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ladda upp CV.');
  }
  const json = await res.json();
  return json.fileId;
}

/**
 * Get the download URL for a student CV.
 */
export function getStudentCVUrl(fileId: string): string {
  if (!fileId) return '';
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  return `${endpoint}/storage/buckets/cvs/files/${fileId}/view?project=${projectId}`;
}

/**
 * Upload a profile picture (avatar) via server-side API.
 * Returns the file ID.
 */
export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', 'avatars');
  const res = await fetch(apiUrl('/api/upload'), {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ladda upp profilbild.');
  }
  const json = await res.json();
  return json.fileId;
}

/**
 * Get the URL for a profile picture.
 */
export function getAvatarUrl(fileId: string): string {
  if (!fileId) return '';
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  return `${endpoint}/storage/buckets/avatars/files/${fileId}/view?project=${projectId}`;
}

/**
 * Complete student onboarding — creates student profile + updates user profile.
 */
export async function onboardStudent(data: StudentOnboardingPayload): Promise<StudentProfileDoc> {
  const res = await fetch(apiUrl('/api/students'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'onboard', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte slutföra registreringen.');
  }
  const json = await res.json();
  return json.profile as StudentProfileDoc;
}
