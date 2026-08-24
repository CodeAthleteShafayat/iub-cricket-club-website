import type { Member } from "@/lib/types";
import { formatBst, toJsDate } from "@/lib/utils/bst";
import { PLAYING_EXPERIENCE_OPTIONS } from "@/lib/constants";

const CSV_COLUMNS: { header: string; get: (m: Member) => string }[] = [
  { header: "Name", get: (m) => m.name },
  { header: "Student ID", get: (m) => m.studentId },
  { header: "Department", get: (m) => m.department },
  { header: "Semester", get: (m) => m.semester },
  { header: "Year", get: (m) => m.year },
  { header: "Role", get: (m) => m.role },
  { header: "Phone", get: (m) => m.phone },
  { header: "Email", get: (m) => m.email },
  { header: "Date of Birth", get: (m) => m.dateOfBirth ?? "" },
  { header: "Blood Group", get: (m) => m.bloodGroup ?? "" },
  {
    header: "Playing Experience",
    get: (m) =>
      PLAYING_EXPERIENCE_OPTIONS.find((e) => e.value === m.playingExperience)?.label ??
      m.playingExperience ??
      "",
  },
  { header: "Cricketing Achievements", get: (m) => m.cricketingAchievements ?? "" },
  { header: "Status", get: (m) => m.status },
  { header: "Admin", get: (m) => (m.isAdmin ? "Yes" : "No") },
  { header: "Recruitment Season", get: (m) => m.recruitmentSeason ?? "" },
  { header: "Recruitment Year", get: (m) => m.recruitmentYear ?? "" },
  {
    header: "Became Member At (BST)",
    get: (m) => (m.status === "approved" ? formatBst(m.reviewedAt) : ""),
  },
  { header: "Applied At", get: (m) => formatTimestamp(m.createdAt) },
];

function formatTimestamp(value: unknown): string {
  const date = toJsDate(value);
  return date ? date.toISOString() : "";
}

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function membersToCsv(members: Member[]): string {
  const header = CSV_COLUMNS.map((c) => escapeCsvField(c.header)).join(",");
  const rows = members.map((m) =>
    CSV_COLUMNS.map((c) => escapeCsvField(c.get(m))).join(",")
  );
  return [header, ...rows].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
