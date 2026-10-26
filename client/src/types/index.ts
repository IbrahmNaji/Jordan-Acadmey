export type Role = 'ADMIN' | 'MANAGER' | 'AGENT';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'INTERESTED'
  | 'FOLLOW_UP'
  | 'ENROLLED'
  | 'LOST'
  | 'NOT_INTERESTED';

export type CourseType = 'MECHANICS' | 'ELECTRICAL' | 'DIAGNOSTICS' | 'HYBRID';

export type Channel =
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'WHATSAPP'
  | 'PHONE'
  | 'WALK_IN'
  | 'REFERRAL'
  | 'GOOGLE_ADS'
  | 'OTHER';

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'SHAM_CASH'
  | 'OTHER';

export type ActivityType =
  | 'CALL'
  | 'WHATSAPP_MSG'
  | 'NOTE'
  | 'STATUS_CHANGE'
  | 'FOLLOW_UP_SET'
  | 'ENROLLMENT';

/** Prisma Decimal يُعاد من الـ API كنص عبر JSON */
export type DecimalLike = string | number;

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface CampaignSource {
  id: string;
  name: string;
  channel: Channel;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { leads: number };
}

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  age?: number | null;
  interestedIn?: CourseType | null;
  sourceId?: string | null;
  status: LeadStatus;
  assignedToId?: string | null;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  lastContactedAt?: string | null;
  convertedAt?: string | null;
  lostReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  source?: { id?: string; name: string; channel: Channel } | null;
  assignedTo?: { id: string; fullName: string; email?: string } | null;
  enrollment?: {
    id: string;
    status: EnrollmentStatus;
    course?: CourseType;
    totalFee?: DecimalLike;
    paidAmount?: DecimalLike;
  } | null;
}

export interface LeadsResponse {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Activity {
  id: string;
  leadId: string;
  userId: string;
  type: ActivityType;
  content: string;
  metadata?: unknown;
  createdAt: string;
  user?: { fullName: string };
}

export interface Payment {
  id: string;
  enrollmentId: string;
  amount: DecimalLike;
  method: PaymentMethod;
  reference?: string | null;
  note?: string | null;
  paidAt: string;
  recordedById?: string | null;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  leadId: string;
  course: CourseType;
  totalFee: DecimalLike;
  paidAmount: DecimalLike;
  paymentPlan?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: EnrollmentStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    fullName: string;
    phone: string;
    whatsapp?: string | null;
    email?: string | null;
  } | null;
  payments?: Payment[];
}

export interface DashboardStats {
  totalLeads: number;
  enrolled: number;
  conversionRate: number;
  totalRevenue: DecimalLike;
  byStatus: Array<{ status: LeadStatus; count: number }>;
  bySource: Array<{ source: string; count: number }>;
}

export interface ReportOverview {
  range: { from: string; to: string };
  summary: {
    newLeads: number;
    enrolledLeads: number;
    conversionRate: number;
    newEnrollments: number;
    activeStudents: number;
    revenue: DecimalLike;
    totalFees: DecimalLike;
    collected: DecimalLike;
    outstanding: DecimalLike;
    followUpsDue: number;
  };
  byStatus: Array<{ status: LeadStatus; count: number }>;
  bySource: Array<{
    sourceId: string | null;
    source: string;
    channel: Channel | null;
    leads: number;
    enrolled: number;
    revenue: DecimalLike;
    conversionRate: number;
  }>;
  byCourse: Array<{
    course: CourseType;
    enrollments: number;
    totalFees: DecimalLike;
    collected: DecimalLike;
    outstanding: DecimalLike;
  }>;
  monthly: Array<{
    month: string;
    leads: number;
    enrollments: number;
    revenue: DecimalLike;
  }>;
}
