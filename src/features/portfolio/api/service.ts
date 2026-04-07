// ============================================================
// Portfolio Service — Data Access Layer
// ============================================================
// All reads and writes go through server-side API routes
// which use the admin SDK (bypasses Appwrite permissions).
// ============================================================

import { storage, BUCKET_IDS } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { apiUrl } from '@/lib/api-client';
import type { PortfolioItemDoc, PortfolioItemPayload } from './types';

/**
 * Get all portfolio items for a student.
 */
export async function getPortfolioItems(userId: string): Promise<PortfolioItemDoc[]> {
  const res = await fetch(apiUrl(`/api/portfolio?userId=${encodeURIComponent(userId)}`));
  if (!res.ok) return [];
  const json = await res.json();
  return (json.items as PortfolioItemDoc[]) ?? [];
}

/**
 * Get a single portfolio item by ID.
 */
export async function getPortfolioItem(id: string): Promise<PortfolioItemDoc> {
  const res = await fetch(apiUrl(`/api/portfolio?id=${encodeURIComponent(id)}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta portfoliopost.');
  }
  const json = await res.json();
  return json.item as PortfolioItemDoc;
}

/**
 * Create a new portfolio item.
 */
export async function createPortfolioItem(data: PortfolioItemPayload): Promise<PortfolioItemDoc> {
  const res = await fetch(apiUrl('/api/portfolio'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skapa portfoliopost.');
  }
  const json = await res.json();
  return json.item as PortfolioItemDoc;
}

/**
 * Update an existing portfolio item.
 */
export async function updatePortfolioItem(
  id: string,
  data: Partial<PortfolioItemPayload>
): Promise<PortfolioItemDoc> {
  const res = await fetch(apiUrl('/api/portfolio'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', itemId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera portfoliopost.');
  }
  const json = await res.json();
  return json.item as PortfolioItemDoc;
}

/**
 * Delete a portfolio item.
 */
export async function deletePortfolioItem(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/portfolio'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', itemId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort portfoliopost.');
  }
}

/**
 * Upload a portfolio file to Appwrite storage.
 * Returns the file ID.
 */
export async function uploadPortfolioFile(file: File): Promise<string> {
  const result = await storage.createFile(BUCKET_IDS.portfolio, ID.unique(), file);
  return result.$id;
}

/**
 * Get the view URL for a portfolio file.
 */
export function getPortfolioFileUrl(fileId: string): string {
  if (!fileId) return '';
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';
  return `${endpoint}/storage/buckets/${BUCKET_IDS.portfolio}/files/${fileId}/view?project=${projectId}`;
}
