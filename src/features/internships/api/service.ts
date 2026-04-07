// ============================================================
// Internship Service — Data Access Layer
// ============================================================
// All reads and writes go through server-side API routes
// which use the admin SDK (bypasses Appwrite permissions).
// ============================================================

import { apiUrl } from '@/lib/api-client';
import type {
  Internship,
  InternshipFilters,
  InternshipsResponse,
  InternshipMutationPayload,
  Application,
  ApplicationFilters,
  ApplicationsResponse,
  ApplicationMutationPayload
} from './types';

// ─── Internships ───────────────────────────────────────────────

export async function getInternships(filters: InternshipFilters): Promise<InternshipsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.field) params.set('field', filters.field);
  if (filters.city) params.set('city', filters.city);
  if (filters.internshipType) params.set('internshipType', filters.internshipType);
  if (filters.status) params.set('status', filters.status);
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.sort) params.set('sort', filters.sort);

  const res = await fetch(apiUrl(`/api/internships?${params.toString()}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta praktikplatser.');
  }
  const json = await res.json();
  return {
    total: json.total ?? 0,
    internships: (json.internships ?? []) as Internship[]
  };
}

export async function getInternshipById(id: string): Promise<Internship> {
  const res = await fetch(apiUrl(`/api/internships?id=${encodeURIComponent(id)}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta praktikplats.');
  }
  const json = await res.json();
  return json.internship as Internship;
}

export async function createInternship(
  companyId: string,
  data: InternshipMutationPayload
): Promise<Internship> {
  const res = await fetch(apiUrl('/api/internships'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', companyId, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skapa praktikplats.');
  }
  const json = await res.json();
  return json.internship as Internship;
}

export async function updateInternship(
  id: string,
  data: Partial<InternshipMutationPayload & { status: string }>
): Promise<Internship> {
  const res = await fetch(apiUrl('/api/internships'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', internshipId: id, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera praktikplats.');
  }
  const json = await res.json();
  return json.internship as Internship;
}

export async function deleteInternship(id: string): Promise<void> {
  const res = await fetch(apiUrl('/api/internships'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', internshipId: id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte ta bort praktikplats.');
  }
}

// ─── Applications ──────────────────────────────────────────────

export async function getApplications(filters: ApplicationFilters): Promise<ApplicationsResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.status) params.set('status', filters.status);
  if (filters.studentId) params.set('studentId', filters.studentId);
  if (filters.internshipId) params.set('internshipId', filters.internshipId);
  if (filters.companyId) params.set('companyId', filters.companyId);
  if (filters.sort) params.set('sort', filters.sort);

  const res = await fetch(apiUrl(`/api/applications?${params.toString()}`));
  if (!res.ok) {
    throw new Error('Kunde inte hämta ansökningar.');
  }
  const json = await res.json();
  return {
    total: json.total ?? 0,
    applications: (json.applications ?? []) as Application[]
  };
}

export async function createApplication(
  studentId: string,
  data: ApplicationMutationPayload
): Promise<Application> {
  const res = await fetch(apiUrl('/api/applications'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', studentId, data })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte skicka ansökan.');
  }
  const json = await res.json();
  return json.application as Application;
}

export async function updateApplicationStatus(
  id: string,
  status: string,
  statusNote?: string
): Promise<Application> {
  const res = await fetch(apiUrl('/api/applications'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateStatus',
      applicationId: id,
      status,
      statusNote
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Kunde inte uppdatera status.');
  }
  const json = await res.json();
  return json.application as Application;
}

export async function withdrawApplication(id: string): Promise<Application> {
  return updateApplicationStatus(id, 'withdrawn');
}
