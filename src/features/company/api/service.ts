// ============================================================
// Company Service — Data Access Layer
// ============================================================
// All reads and writes go through server-side API routes
// which use the admin SDK (bypasses Appwrite permissions).
// ============================================================

import { storage, BUCKET_IDS } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { apiUrl } from '@/lib/api-client';
import type { CompanyProfile, CompanyProfilePayload } from './types';

/**
 * Get company profile by the authenticated user's ID.
 * Returns null if no profile exists yet (company hasn't onboarded).
 */
export async function getCompanyProfile(userId: string): Promise<CompanyProfile | null> {
  const res = await fetch(apiUrl(`/api/company?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return null;
  const json = await res.json();
  return (json.profile as CompanyProfile) ?? null;
}

/**
 * Get company profile by document ID.
 */
export async function getCompanyById(id: string): Promise<CompanyProfile> {
  const res = await fetch(apiUrl(`/api/company?id=${encodeURIComponent(id)}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta företagsprofil.');
  }
  const json = await res.json();
  return json.profile as CompanyProfile;
}

/**
 * Create a new company profile (onboarding).
 * Uses server-side API route for admin SDK access.
 */
export async function createCompanyProfile(
  userId: string,
  data: CompanyProfilePayload
): Promise<CompanyProfile> {
  const res = await fetch(apiUrl('/api/company'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skapa företagsprofil.');
  }
  const json = await res.json();
  return json.profile as CompanyProfile;
}

/**
 * Update an existing company profile.
 * Uses server-side API route for admin SDK access.
 */
export async function updateCompanyProfile(
  id: string,
  data: Partial<CompanyProfilePayload>
): Promise<CompanyProfile> {
  const res = await fetch(apiUrl('/api/company'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', companyId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera företagsprofil.');
  }
  const json = await res.json();
  return json.profile as CompanyProfile;
}

/**
 * Upload company logo to Appwrite storage.
 * Returns the file ID.
 */
export async function uploadCompanyLogo(file: File): Promise<string> {
  const result = await storage.createFile(BUCKET_IDS.logos, ID.unique(), file);
  return result.$id;
}

/**
 * Get the preview URL for a company logo.
 */
export function getCompanyLogoUrl(fileId: string): string {
  if (!fileId) return '';
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  return `${endpoint}/storage/buckets/${BUCKET_IDS.logos}/files/${fileId}/preview?project=${projectId}&width=200&height=200`;
}
