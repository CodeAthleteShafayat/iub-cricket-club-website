import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Member, MemberStatus, PlayerRole } from "@/lib/types";

export interface SignupInput {
  uid: string;
  name: string;
  studentId: string;
  department: string;
  batch: string;
  role: PlayerRole;
  phone: string;
  email: string;
}

export async function createMemberDoc(input: SignupInput) {
  await setDoc(doc(db, "members", input.uid), {
    ...input,
    photoURL: null,
    status: "pending",
    isAdmin: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
  });
}

export type OwnProfileEdits = Partial<
  Pick<
    Member,
    "name" | "studentId" | "department" | "batch" | "role" | "phone" | "photoURL"
  >
>;

export async function updateOwnProfile(uid: string, edits: OwnProfileEdits) {
  await updateDoc(doc(db, "members", uid), {
    ...edits,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToMembersByStatus(
  status: MemberStatus,
  callback: (members: Member[]) => void
) {
  const q = query(
    collection(db, "members"),
    where("status", "==", status),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Member));
  });
}

export function subscribeToAllMembers(callback: (members: Member[]) => void) {
  const q = query(collection(db, "members"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Member));
  });
}

export async function approveMember(uid: string, adminUid: string) {
  await updateDoc(doc(db, "members", uid), {
    status: "approved",
    reviewedBy: adminUid,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
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
