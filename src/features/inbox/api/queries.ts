import { queryOptions } from '@tanstack/react-query';
import {
  getConversations,
  getMessages,
  getStudentDetails,
  getCompanyDetails,
  getApplicants
} from './service';
import type { ConversationStatus, ConversationFilter } from './types';

// ─── Key Factories ─────────────────────────────────────────────

export const inboxKeys = {
  all: ['inbox'] as const,
  conversations: (filters: {
    status?: ConversationStatus;
    search?: string;
    internshipId?: string;
    filter?: ConversationFilter;
  }) => [...inboxKeys.all, 'conversations', filters] as const,
  messages: (conversationId: string) => [...inboxKeys.all, 'messages', conversationId] as const,
  studentDetails: (studentId: string) => [...inboxKeys.all, 'student', studentId] as const,
  companyDetails: (companyId: string) => [...inboxKeys.all, 'company', companyId] as const,
  applicants: () => [...inboxKeys.all, 'applicants'] as const,
  unreadCount: () => [...inboxKeys.all, 'unreadCount'] as const
};

// ─── Query Options ─────────────────────────────────────────────

export function conversationsQueryOptions(filters: {
  status?: ConversationStatus;
  search?: string;
  internshipId?: string;
  filter?: ConversationFilter;
}) {
  return queryOptions({
    queryKey: inboxKeys.conversations(filters),
    queryFn: () => getConversations(filters),
    staleTime: 3_000,
    refetchInterval: 3_000
  });
}

export function messagesQueryOptions(conversationId: string) {
  return queryOptions({
    queryKey: inboxKeys.messages(conversationId),
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
    staleTime: 3_000,
    refetchInterval: 3_000
  });
}

export function studentDetailsQueryOptions(studentId: string) {
  return queryOptions({
    queryKey: inboxKeys.studentDetails(studentId),
    queryFn: () => getStudentDetails(studentId),
    enabled: !!studentId,
    staleTime: 60_000 // Cache for 1 min
  });
}

export function companyDetailsQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: inboxKeys.companyDetails(companyId),
    queryFn: () => getCompanyDetails(companyId),
    enabled: !!companyId,
    staleTime: 60_000
  });
}

export function applicantsQueryOptions() {
  return queryOptions({
    queryKey: inboxKeys.applicants(),
    queryFn: () => getApplicants(),
    staleTime: 60_000
  });
}

export function unreadCountQueryOptions() {
  return queryOptions({
    queryKey: inboxKeys.unreadCount(),
    queryFn: async () => {
      const data = await getConversations({});
      return data.unreadTotal;
    },
    staleTime: 3_000,
    refetchInterval: 3_000
  });
}
