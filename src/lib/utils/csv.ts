import type { Member } from "@/lib/types";
import { formatBstSortable } from "@/lib/utils/bst";
import { PLAYING_EXPERIENCE_OPTIONS } from "@/lib/constants";

const CSV_COLUMNS: { header: string; get: (m: Member, index: number) => string }[] = [
  { header: "#", get: (_m, index) => String(index + 1) },
  { header: "Name", get: (m) => m.name },
  { header: "Photo URL", get: (m) => m.photoURL ?? "" },
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
    get: (m) => (m.status === "approved" ? formatBstSortable(m.reviewedAt) : ""),
  },
  { header: "Applied At (BST)", get: (m) => formatBstSortable(m.createdAt) },
];

function escapeCsvField(value: string): string {
  // Defuse spreadsheet formula injection before anything else. Excel, Sheets,
  // and LibreOffice execute a cell whose text begins with =, +, -, @, or a
  // leading tab/CR. Several columns here are free text a member types about
  // themselves (name, achievements, department), so a hostile applicant could
  // otherwise plant something like =HYPERLINK("http://evil","click me") and
  // have it run the moment an admin opens the export -- which is the entire
  // point of the export, so it would run.
  //
  // Prefixing with an apostrophe is the standard fix: spreadsheets treat the
  // rest as literal text and don't display the apostrophe itself.
  let safe = value;
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = `'${safe}`;
  }

  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function membersToCsv(members: Member[]): string {
  const header = CSV_COLUMNS.map((c) => escapeCsvField(c.header)).join(",");
  const rows = members.map((m, index) =>
    CSV_COLUMNS.map((c) => escapeCsvField(c.get(m, index))).join(",")
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
