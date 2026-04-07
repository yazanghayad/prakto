// Platform roles — the 4 core roles in Prakto
export const USER_ROLES = ['student', 'company', 'education_manager', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// User status
export const USER_STATUSES = ['active', 'pending', 'deactivated'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// Appwrite user profile (from `users` collection, extends Appwrite Auth)
export interface UserProfile {
  userId: string;
  role: UserRole;
  displayName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

// Student profile (from `students` collection)
export const EDUCATION_LEVELS = ['yh', 'university', 'gymnasie', 'other'] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const INTERNSHIP_TYPES = ['lia', 'vfu', 'apl'] as const;
export type InternshipType = (typeof INTERNSHIP_TYPES)[number];

export const PLACEMENT_STATUSES = ['searching', 'applied', 'placed', 'completed'] as const;
export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export interface StudentProfile {
  userId: string;
  school: string;
  program: string;
  educationLevel: EducationLevel;
  internshipType: InternshipType[];
  city: string;
  skills: string[];
  bio: string;
  cvFileId?: string;
  linkedinUrl?: string;
  programId?: string;
  placementStatus: PlacementStatus;
}

// Company profile (from `companies` collection)
export const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface CompanyProfile {
  userId: string;
  companyName: string;
  orgNumber: string;
  industry: string;
  description: string;
  website?: string;
  logoFileId?: string;
  city: string;
  contactEmail: string;
  contactPhone?: string;
  approvalStatus: ApprovalStatus;
  approvalNote?: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Education Manager profile (from `education_managers` collection)
export interface EducationManagerProfile {
  userId: string;
  school: string;
  department?: string;
  title?: string;
  phone?: string;
}

// Internship listing (from `internships` collection)
export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'closed'
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export interface Internship {
  internshipId: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string;
  field: string;
  internshipType: InternshipType;
  city: string;
  remote: boolean;
  duration: string;
  spots: number;
  startDate?: string;
  status: ListingStatus;
  moderationNote?: string;
  moderatedBy?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

// Application (from `applications` collection)
export const APPLICATION_STATUSES = [
  'submitted',
  'reviewed',
  'interview',
  'accepted',
  'rejected',
  'withdrawn'
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  applicationId: string;
  studentId: string;
  internshipId: string;
  companyId: string;
  cvFileId: string;
  message?: string;
  status: ApplicationStatus;
  statusNote?: string;
  appliedAt: string;
  updatedAt: string;
}

// Notification (from `notifications` collection)
export const NOTIFICATION_TYPES = [
  'application_status',
  'company_approved',
  'listing_approved',
  'system',
  'recommendation'
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

// Role display labels (Swedish UI)
export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  company: 'Företag',
  education_manager: 'Utbildningsledare',
  admin: 'Administratör'
};

// Internship type labels (Swedish UI)
export const INTERNSHIP_TYPE_LABELS: Record<InternshipType, string> = {
  lia: 'LIA',
  vfu: 'VFU',
  apl: 'APL'
};

// Education level labels (Swedish UI)
export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, string> = {
  yh: 'Yrkeshögskola',
  university: 'Universitet/Högskola',
  gymnasie: 'Gymnasie',
  other: 'Övrigt'
};
