// Bangladesh Standard Time is a fixed UTC+6 offset with no DST, so plain
// Intl.DateTimeFormat + a hardcoded "+06:00" suffix is correct and needs no
// timezone library (date-fns-tz isn't installed).

const BST_TIME_ZONE = "Asia/Dhaka";

// Firestore's serverTimestamp() resolves to a Timestamp object (with a
// toDate() method) at read time, not the plain number our types declare —
// handle both, matching the same normalization csv.ts needs.
export function toJsDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

export function formatBst(value: unknown): string {
  const date = toJsDate(value);
  if (!date) return "";

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BST_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    // h23 rather than hour12:false — the latter renders midnight as "24:xx" in
    // some browsers, which would be wrong in both display and form round-trips.
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")}, ${get("hour")}:${get("minute")}:${get("second")}`;
}

// Interprets an <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm" or
// "...:ss") as Bangladesh wall-clock time, regardless of the admin's own
// machine/browser timezone. Do not use `new Date(value)` directly for this.
export function datetimeLocalToBstDate(value: string): Date {
  const normalized = value.length === 16 ? `${value}:00` : value;
  return new Date(`${normalized}+06:00`);
}

// Inverse of datetimeLocalToBstDate, for pre-filling the settings form.
export function bstDateToDatetimeLocalValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    // h23 rather than hour12:false — the latter renders midnight as "24:xx" in
    // some browsers, which would be wrong in both display and form round-trips.
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
