import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type {
  BloodGroup,
  Member,
  PlayerRole,
  PlayingExperience,
  Semester,
} from "@/lib/types";
import { getRecruitmentWindow, isWindowOpen } from "@/lib/services/recruitment";
import { deleteMemberCompletely, sendWelcomeEmail } from "@/lib/services/adminEmail";

export interface SignupInput {
  uid: string;
  name: string;
  studentId: string;
  department: string;
  semester: Semester;
  year: string;
  role: PlayerRole;
  phone: string;
  email: string;
  photoURL: string;
  dateOfBirth: string;
  bloodGroup: BloodGroup;
  playingExperience: PlayingExperience;
  cricketingAchievements: string;
}

export async function createMemberDoc(input: SignupInput) {
  await setDoc(doc(db, "members", input.uid), {
    ...input,
    status: "pending",
    isAdmin: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
    recruitmentSeason: null,
    recruitmentYear: null,
  });
}

export type OwnProfileEdits = Partial<
  Pick<
    Member,
    | "name"
    | "studentId"
    | "department"
    | "semester"
    | "year"
    | "role"
    | "phone"
    | "photoURL"
    | "dateOfBirth"
    | "bloodGroup"
    | "playingExperience"
    | "cricketingAchievements"
  >
>;

export async function updateOwnProfile(uid: string, edits: OwnProfileEdits) {
  await updateDoc(doc(db, "members", uid), {
    ...edits,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToAllMembers(callback: (members: Member[]) => void) {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Member));
  });
}

export async function approveMember(uid: string, adminUid: string) {
  const window = await getRecruitmentWindow();
  if (!isWindowOpen(window)) {
    throw new Error("Recruitment window is closed");
  }
  await updateDoc(doc(db, "members", uid), {
    status: "approved",
    recruitmentSeason: window!.season,
    recruitmentYear: window!.year,
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Membership is approved regardless of whether the notification email
  // sends -- Firestore is the source of truth, the email is a courtesy.
  sendWelcomeEmail(uid).catch(() => {});
}

export async function rejectMember(uid: string, adminUid: string) {
  await updateDoc(doc(db, "members", uid), {
    status: "rejected",
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setMemberAdmin(uid: string, isAdmin: boolean) {
  await updateDoc(doc(db, "members", uid), {
    isAdmin,
    updatedAt: serverTimestamp(),
  });
}

// Goes through the admin API route rather than deleting the doc directly:
// removing members/{uid} alone would leave the person's Firebase Auth login
// intact, so they could still sign in and their email would stay
// permanently unavailable for re-registration.
export async function deleteMember(uid: string) {
  await deleteMemberCompletely(uid);
}
