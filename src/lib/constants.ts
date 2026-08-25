import type { BloodGroup, PlayerRole, PlayingExperience, Semester } from "@/lib/types";

export const ROLE_OPTIONS: { value: PlayerRole; label: string }[] = [
  { value: "batsman", label: "Batsman" },
  { value: "bowler", label: "Bowler" },
  { value: "all-rounder", label: "All-rounder" },
  { value: "wicketkeeper", label: "Wicketkeeper" },
];

export const SEMESTER_OPTIONS: Semester[] = ["Spring", "Summer", "Autumn"];

export interface DepartmentOption {
  name: string;
  school: string;
  /** Common abbreviations/alternate names so typing "CS" or "Sociology" can still surface the official name. */
  aliases: string[];
}

// Source of truth: IUB's own academics API (iub.ac.bd/api/schools/{slug}),
// grouped by school the way the university itself organizes departments.
const DEPARTMENT_GROUP_DATA: { school: string; departments: { name: string; aliases: string[] }[] }[] = [
  {
    school: "School of Business and Entrepreneurship",
    departments: [
      { name: "Accounting", aliases: ["ACT", "ACC"] },
      { name: "Economics", aliases: ["ECO", "ECON"] },
      { name: "Finance", aliases: ["FIN"] },
      { name: "General Management", aliases: ["Management", "MGT"] },
      { name: "Human Resource Management", aliases: ["HRM"] },
      { name: "International Business", aliases: ["IB"] },
      { name: "Management Information Systems", aliases: ["MIS"] },
      { name: "Marketing", aliases: ["MKT"] },
    ],
  },
  {
    school: "School of Engineering, Technology and Sciences",
    departments: [
      { name: "Computer Science and Engineering", aliases: ["CSE", "CS"] },
      { name: "Electrical and Electronic Engineering", aliases: ["EEE"] },
      { name: "Physical Sciences", aliases: ["PS"] },
    ],
  },
  {
    school: "School of Environment and Life Sciences",
    departments: [
      { name: "Environmental Science and Management", aliases: ["ESM"] },
      { name: "Life Sciences", aliases: ["Microbiology", "Biotechnology"] },
    ],
  },
  {
    school: "School of Law",
    departments: [{ name: "Law", aliases: ["LLB"] }],
  },
  {
    school: "School of Liberal Arts and Social Sciences",
    departments: [
      { name: "English and Modern Languages", aliases: ["English", "EML"] },
      { name: "Global Studies and Governance", aliases: ["GSG"] },
      { name: "Media and Communication", aliases: ["Media", "MnC"] },
      { name: "Social Sciences and Humanities", aliases: ["Sociology", "SSH"] },
    ],
  },
  {
    school: "School of Pharmacy and Public Health",
    departments: [
      { name: "Pharmacy", aliases: ["Pharm"] },
      { name: "Public Health", aliases: ["PH", "MPH"] },
    ],
  },
];

export const DEPARTMENT_ENTRIES: DepartmentOption[] = DEPARTMENT_GROUP_DATA.flatMap((g) =>
  g.departments.map((d) => ({ ...d, school: g.school }))
);

export const BLOOD_GROUP_OPTIONS: BloodGroup[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export const PLAYING_EXPERIENCE_OPTIONS: { value: PlayingExperience; label: string }[] = [
  { value: "none", label: "No prior organized experience" },
  { value: "school", label: "School cricket" },
  { value: "college", label: "College cricket" },
  { value: "university", label: "University cricket" },
  { value: "club", label: "Club cricket" },
  { value: "professional", label: "Professional / First-class cricket" },
];

export const CLUB_NAME = "IUB Cricket Club";

export const IUB_EMAIL_DOMAIN = "iub.edu.bd";

// Single source of truth: rendered in the site Footer and in outgoing email
// templates, so a changed handle only has to be updated in one place.
export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/iubcricketclub",
  instagram: "https://www.instagram.com/iub_cricket_club",
} as const;

// --- Email sending safety rails ---------------------------------------
// Not a Gmail rule we know to be true — a self-imposed cap so a mistake
// (or a very large cohort) can't burn through the mailbox's real quota and
// get it temporarily locked for sending. Raise it via
// NEXT_PUBLIC_DAILY_EMAIL_LIMIT once the real ceiling is known; anything
// over the cap isn't dropped, it rolls to the next day's batch.
export const DAILY_EMAIL_LIMIT =
  Number(process.env.NEXT_PUBLIC_DAILY_EMAIL_LIMIT) || 400;

// Separate from the daily cap: one serverless invocation has a wall-clock
// timeout (see `maxDuration` on the email routes), so a single run only
// ever drains this many. The rest waits for the next cron run.
export const MAX_EMAILS_PER_RUN = 150;
