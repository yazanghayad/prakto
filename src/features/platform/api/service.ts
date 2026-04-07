// ============================================================
// Platform Service — Data Access Layer (Appwrite)
// ============================================================
// Handles students and companies data for admin/ed-manager views.
// ============================================================

import { databases, DATABASE_ID, COLLECTION_IDS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import type {
  StudentListItem,
  StudentFilters,
  StudentsResponse,
  CompanyListItem,
  CompanyFilters,
  CompaniesResponse
} from './types';

// ─── Students ──────────────────────────────────────────────────

export async function getStudents(filters: StudentFilters): Promise<StudentsResponse> {
  const queries: string[] = [];
  const { page = 1, limit = 10, search, placementStatus, programId, sort } = filters;

  queries.push(Query.limit(limit));
  queries.push(Query.offset((page - 1) * limit));

  if (search) {
    queries.push(Query.search('school', search));
  }
  if (placementStatus) {
    queries.push(Query.equal('placementStatus', placementStatus));
  }
  if (programId) {
    queries.push(Query.equal('programId', programId));
  }

  if (sort) {
    const [field, dir] = sort.split('.');
    if (field && dir) {
      queries.push(dir === 'desc' ? Query.orderDesc(field) : Query.orderAsc(field));
    }
  }

  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.students, queries);

  return {
    total: response.total,
    students: response.documents as unknown as StudentListItem[]
  };
}

// ─── Companies ─────────────────────────────────────────────────

export async function getCompanies(filters: CompanyFilters): Promise<CompaniesResponse> {
  const queries: string[] = [];
  const { page = 1, limit = 10, search, approvalStatus, sort } = filters;

  queries.push(Query.limit(limit));
  queries.push(Query.offset((page - 1) * limit));

  if (search) {
    queries.push(Query.search('companyName', search));
  }
  if (approvalStatus) {
    queries.push(Query.equal('approvalStatus', approvalStatus));
  }

  if (sort) {
    const [field, dir] = sort.split('.');
    if (field && dir) {
      queries.push(dir === 'desc' ? Query.orderDesc(field) : Query.orderAsc(field));
    }
  }

  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.companies, queries);

  return {
    total: response.total,
    companies: response.documents as unknown as CompanyListItem[]
  };
}

export async function updateCompanyApproval(
  id: string,
  status: 'approved' | 'rejected',
  adminId: string,
  note?: string
) {
  return databases.updateDocument(DATABASE_ID, COLLECTION_IDS.companies, id, {
    approvalStatus: status,
    approvedBy: adminId,
    approvedAt: new Date().toISOString(),
    ...(note && { approvalNote: note })
  });
}
