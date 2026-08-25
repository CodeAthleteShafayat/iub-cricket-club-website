export type MemberStatus = "pending" | "approved" | "rejected";

export type PlayerRole = "batsman" | "bowler" | "all-rounder" | "wicketkeeper";

export type Semester = "Spring" | "Summer" | "Autumn";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type PlayingExperience =
  | "none"
  | "school"
  | "college"
  | "university"
  | "club"
  | "professional";

export interface Member {
  uid: string;
  name: string;
  studentId: string;
  department: string;
  semester: Semester;
  year: string;
  role: PlayerRole;
  phone: string;
  email: string;
  photoURL: string | null;
  dateOfBirth: string;
  bloodGroup: BloodGroup;
  playingExperience: PlayingExperience;
  /** Optional free text; only meaningful for applicants with something notable to mention. */
  cricketingAchievements: string;
  status: MemberStatus;
  isAdmin: boolean;
  createdAt: number;
  updatedAt: number;
  reviewedBy: string | null;
  reviewedAt: number | null;
  /** Recruitment cohort auto-stamped from the active RecruitmentWindow at approval time. Null for members approved before this feature existed. */
  recruitmentSeason: Semester | null;
  recruitmentYear: string | null;
}

/** Admin-configured time frame during which a pending applicant may be approved into a member. Singleton doc at config/recruitmentWindow. */
export interface RecruitmentWindow {
  season: Semester;
  year: string;
  startAt: number;
  endAt: number;
  setBy: string;
  updatedAt: number;
}

/** Admin-editable text + image block shown on the public About page. Singleton doc at content/about. */
export interface AboutContent {
  body: string;
  imageURL: string | null;
  updatedBy: string;
  updatedAt: number;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  imageURL: string | null;
  authorUid: string;
  authorName: string;
  createdAt: number;
  updatedAt: number;
}

export interface CommunityMessage {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhotoURL: string | null;
  text: string;
  createdAt: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  /** Caption shown under the photo. Empty string when untitled; absent entirely on images uploaded before captions existed. */
  title: string;
  uploadedBy: string;
  featuredOnHome: boolean;
  createdAt: number;
}

export interface EmailCampaignRecipient {
  uid: string;
  email: string;
  name: string;
  sentAt: number | null;
}

/** Bulk announcement email queue, capped at 100 sends/day (shared with the
 * per-approval welcome email) and drained by the daily cron batch job when a
 * campaign has more recipients than that. Singleton per send, at
 * emailCampaigns/{id}. */
export interface EmailCampaign {
  id: string;
  subject: string;
  bodyText: string;
  createdBy: string;
  createdAt: number;
  status: "sending" | "completed";
  totalRecipients: number;
  sentCount: number;
  recipients: EmailCampaignRecipient[];
}
