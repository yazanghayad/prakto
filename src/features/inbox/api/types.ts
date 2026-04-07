// Conversation & message types mirroring the Appwrite schema

export interface Conversation {
  $id: string;
  companyId: string;
  studentId: string;
  internshipId: string;
  applicationId: string;
  studentName: string;
  studentEmail: string;
  companyName?: string;
  internshipTitle: string;
  lastMessage: string;
  lastSenderId: string;
  status: 'open' | 'snoozed' | 'done';
  isStarred: boolean;
  isReadByCompany: boolean;
  isReadByStudent: boolean;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface Message {
  $id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'company';
  text: string;
  isRead: boolean;
  attachmentId?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  internships: { $id: string; title: string }[];
  total: number;
  unreadTotal: number;
}

export interface MessagesResponse {
  messages: Message[];
  conversation: Conversation;
  total: number;
}

export interface StudentDetails {
  user: {
    userId: string;
    displayName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  student: {
    school: string;
    program: string;
    city: string;
    skills: string[];
    bio: string;
    cvFileId?: string;
    linkedinUrl?: string;
    placementStatus: string;
  } | null;
}

export interface CompanyDetails {
  company: {
    $id: string;
    name: string;
    industry?: string;
    city?: string;
    website?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    logoUrl?: string;
  } | null;
  user: {
    userId: string;
    displayName: string;
    email: string;
    phone?: string;
  } | null;
}

export type ConversationStatus = 'open' | 'snoozed' | 'done';
export type ConversationFilter = 'all' | 'unread' | 'starred';

export interface Applicant {
  $id: string;
  studentId: string;
  studentName: string;
  internshipId: string;
  internshipTitle: string;
  status: string;
  appliedAt: string;
  conversationId: string | null;
}

export interface ApplicantsResponse {
  applicants: Applicant[];
}
