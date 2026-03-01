// Re-export generated Prisma types
export type {
  User,
  UserProfile,
  Clan,
  Member,
  Relationship,
  MemberSpouse,
  MemberMedia,
  GraveSite,
  SiteMedia,
  RitualEvent,
  RitualInstruction,
  RitualDuty,
  Duty,
  DutyLog,
  VirtualOffering,
  Notification,
  AuditLog,
  GenderType,
  LineageRole,
  UserRole,
  RelationshipType,
  SiteCondition,
  SiteType,
  DutyCategory,
  DutyStatus,
  DutyPriority,
  AssignedGroup,
  MediaType,
  OfferingType,
  NotificationType,
} from "@/generated/prisma/client";

// ── API Response Shapes ──────────────────────────────────
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Session user ─────────────────────────────────────────
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
  clanId?: string | null;
}

// ── Member tree node (for D3 lineage visualization) ──────
export interface MemberNode {
  id: string;
  fullName: string;
  gender: string;
  isDeceased: boolean;
  birthDateSolar?: string | null;
  deathDateSolar?: string | null;
  avatarUrl?: string | null;
  generation: number;
  lineageRole: string;
  branchName?: string | null;
  parentIds: string[];
  childIds: string[];
  spouseIds: string[];
  graveSiteId?: string | null;
  activeDutyCount: number;
}

// ── Duty board types ─────────────────────────────────────
export interface DutyCard {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: "QUEUE" | "ACTIVE" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  progress: number;
  dueDate?: string | null;
  assignee?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}

// ── Ritual calendar event ─────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  dateSolar: string;
  dateLunar?: string | null;
  isCertified: boolean;
  isRecurring: boolean;
  ancestor?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
}

// ── Grave site map marker ─────────────────────────────────
export interface SiteMarker {
  id: string;
  memberId: string;
  memberName: string;
  latitude: number;
  longitude: number;
  condition: string;
  siteType: string;
  epitaph?: string | null;
  lastVisited?: string | null;
  hasPanorama: boolean;
}

// ── Duty workload (for member workload panel) ─────────────
export interface MemberWorkload {
  memberId: string;
  fullName: string;
  avatarUrl?: string | null;
  lineageName?: string | null;
  workloadStatus: "AVAILABLE" | "ON_DUTY" | "OVERLOADED";
  currentDutyTitle?: string | null;
  workloadIntensity: number;
}

// ── Clan statistics ───────────────────────────────────────
export interface ClanStats {
  totalMembers: number;
  livingMembers: number;
  deceasedMembers: number;
  totalGenerations: number;
  ritualCount: number;
  dutiesActive: number;
  sitesRegistered: number;
}

// ── Duty stats (dashboard KPIs) ──────────────────────────
export interface DutyStats {
  totalActive: number;
  pendingReview: number;
  efficiencyRating: number;
  assignedMembers: number;
}
