import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { RecruitmentWindow, Semester } from "@/lib/types";
import { toJsDate } from "@/lib/utils/bst";

const WINDOW_DOC = doc(db, "config", "recruitmentWindow");

export interface SetRecruitmentWindowInput {
  season: Semester;
  year: string;
  startAt: Date;
  endAt: Date;
  adminUid: string;
}

export async function setRecruitmentWindow(input: SetRecruitmentWindowInput) {
  await setDoc(WINDOW_DOC, {
    season: input.season,
    year: input.year,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    setBy: input.adminUid,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToRecruitmentWindow(
  callback: (window: RecruitmentWindow | null) => void
) {
  return onSnapshot(WINDOW_DOC, (snap) => {
    callback(snap.exists() ? (snap.data() as RecruitmentWindow) : null);
  });
}

export async function getRecruitmentWindow(): Promise<RecruitmentWindow | null> {
  const snap = await getDoc(WINDOW_DOC);
  return snap.exists() ? (snap.data() as RecruitmentWindow) : null;
}

export function isWindowOpen(
  window: RecruitmentWindow | null,
  now: Date = new Date()
): boolean {
  if (!window) return false;
  const start = toJsDate(window.startAt);
  const end = toJsDate(window.endAt);
  if (!start || !end) return false;
  const nowMs = now.getTime();
  return start.getTime() <= nowMs && nowMs <= end.getTime();
}
