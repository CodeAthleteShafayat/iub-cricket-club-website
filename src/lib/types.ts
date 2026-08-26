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

export type TournamentStatus = "upcoming" | "ongoing" | "completed";

export interface Tournament {
  id: string;
  name: string;
  description: string;
  venue: string;
  /** Plain YYYY-MM-DD calendar dates, not timestamps — a tournament spans days,
   *  and pinning them to an instant would shift the date across timezones. */
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  imageURL: string | null;
  /** Default innings length for this tournament's matches, and the "full quota"
   *  figure the all-out rule charges in net run rate. Never hardcode 20. */
  oversPerInnings: number;
  pointsForWin: number;
  /** Also awarded for a no-result or abandoned match. */
  pointsForTie: number;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export type MatchStatus = "scheduled" | "completed" | "abandoned";

/** One team's innings, entered once after the match is played. */
export interface InningsResult {
  runs: number;
  wickets: number;
  /** Legal balls faced, as an integer. Overs are base-6 (after 16.5 comes
   *  17.0), so a decimal "16.2" can't be added or compared correctly. Store
   *  balls, derive the display via formatOvers(). */
  balls: number;
}

export interface Match {
  id: string;
  /** null for a standalone friendly that isn't part of any tournament. */
  tournamentId: string | null;
  teamA: string;
  teamB: string;
  venue: string;
  startAt: number;
  oversPerInnings: number;
  status: MatchStatus;
  /** All four stay null until an admin uploads the result. */
  inningsA: InningsResult | null;
  inningsB: InningsResult | null;
  outcome: "A" | "B" | "tie" | "no-result" | null;
  resultText: string | null;
  createdAt: number;
  updatedAt: number;
  updatedBy: string;
}

/** Derived on read from a tournament's matches, never stored — a persisted
 *  table can silently drift from the results it claims to summarise. */
export interface StandingsRow {
  team: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  /** Net run rate, or null when the team has no NRR-eligible completed match. */
  nrr: number | null;
  runsScored: number;
  runsConceded: number;
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
