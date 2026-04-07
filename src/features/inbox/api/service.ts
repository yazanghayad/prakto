import type {
  ConversationsResponse,
  MessagesResponse,
  StudentDetails,
  CompanyDetails,
  ApplicantsResponse,
  ConversationStatus,
  ConversationFilter
} from './types';

const API_BASE = '/api/messages';

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Serverfel (${res.status})`);
  }
  return res.json();
}

// ─── Conversations ─────────────────────────────────────────────

export async function getConversations(params: {
  status?: ConversationStatus;
  search?: string;
  internshipId?: string;
  filter?: ConversationFilter;
}): Promise<ConversationsResponse> {
  const sp = new URLSearchParams({ action: 'conversations' });
  if (params.status) sp.set('status', params.status);
  if (params.search) sp.set('search', params.search);
  if (params.internshipId) sp.set('internshipId', params.internshipId);
  if (params.filter) sp.set('filter', params.filter);
  return fetchJson(`${API_BASE}?${sp.toString()}`);
}

// ─── Messages ──────────────────────────────────────────────────

export async function getMessages(conversationId: string): Promise<MessagesResponse> {
  const sp = new URLSearchParams({
    action: 'messages',
    conversationId
  });
  return fetchJson(`${API_BASE}?${sp.toString()}`);
}

// ─── Student Details ───────────────────────────────────────────

export async function getStudentDetails(studentId: string): Promise<StudentDetails> {
  const sp = new URLSearchParams({
    action: 'studentDetails',
    studentId
  });
  return fetchJson(`${API_BASE}?${sp.toString()}`);
}

// ─── Company Details ───────────────────────────────────────────

export async function getCompanyDetails(companyId: string): Promise<CompanyDetails> {
  const sp = new URLSearchParams({
    action: 'companyDetails',
    companyId
  });
  return fetchJson(`${API_BASE}?${sp.toString()}`);
}

// ─── Send Message ──────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  text: string
): Promise<{ message: unknown }> {
  return fetchJson(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sendMessage', conversationId, text })
  });
}

// ─── Create Conversation ───────────────────────────────────────

export async function createConversation(params: {
  studentId: string;
  internshipId?: string;
  applicationId?: string;
  initialMessage?: string;
}): Promise<{ conversation: unknown }> {
  return fetchJson(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'createConversation', ...params })
  });
}

// ─── Update Status ─────────────────────────────────────────────

export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<{ success: boolean }> {
  return fetchJson(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'updateStatus', conversationId, status })
  });
}

// ─── Toggle Star ───────────────────────────────────────────────

export async function toggleConversationStar(
  conversationId: string
): Promise<{ success: boolean; isStarred: boolean }> {
  return fetchJson(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'toggleStar', conversationId })
  });
}

// ─── Delete Conversation ───────────────────────────────────────

export async function deleteConversation(conversationId: string): Promise<{ success: boolean }> {
  return fetchJson(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'deleteConversation', conversationId })
  });
}

// ─── Get Applicants (company only) ─────────────────────────────

export async function getApplicants(): Promise<ApplicantsResponse> {
  const sp = new URLSearchParams({ action: 'applicants' });
  return fetchJson(`${API_BASE}?${sp.toString()}`);
}
