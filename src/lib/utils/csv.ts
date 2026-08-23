import type { Member } from "@/lib/types";

const CSV_COLUMNS: { header: string; get: (m: Member) => string }[] = [
  { header: "Name", get: (m) => m.name },
  { header: "Student ID", get: (m) => m.studentId },
  { header: "Department", get: (m) => m.department },
  { header: "Batch", get: (m) => m.batch },
  { header: "Role", get: (m) => m.role },
  { header: "Phone", get: (m) => m.phone },
  { header: "Email", get: (m) => m.email },
  { header: "Status", get: (m) => m.status },
  { header: "Admin", get: (m) => (m.isAdmin ? "Yes" : "No") },
  { header: "Applied At", get: (m) => formatTimestamp(m.createdAt) },
];

// Firestore's serverTimestamp() resolves to a Timestamp object (with a
// toDate() method) at read time, not the plain number our types declare —
// handle both so real data doesn't render as "Invalid Date".
function formatTimestamp(value: unknown): string {
  if (!value) return "";
  if (typeof value === "number") return new Date(value).toISOString();
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return "";
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
