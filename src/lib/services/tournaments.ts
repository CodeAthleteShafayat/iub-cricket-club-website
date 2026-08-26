import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Tournament } from "@/lib/types";

export interface TournamentInput {
  name: string;
  description: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: Tournament["status"];
  imageURL: string | null;
  oversPerInnings: number;
  groups: string[];
  pointsForWin: number;
  pointsForTie: number;
  createdBy: string;
}

export async function createTournament(input: TournamentInput) {
  await addDoc(collection(db, "tournaments"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// Sorted newest-first by start date so the current season leads the list.
// Grouping by status happens in the UI rather than in the query -- it avoids a
// composite index and the collection is small enough that filtering client-side
// costs nothing.
export function subscribeToTournaments(
  callback: (tournaments: Tournament[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(collection(db, "tournaments"), orderBy("startDate", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tournament));
    },
    // Without this a permission-denied or still-building index leaves the page
    // spinning forever with nothing in the console to explain it.
    (error) => onError?.(error)
  );
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const snap = await getDoc(doc(db, "tournaments", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Tournament) : null;
}

export async function updateTournament(
  id: string,
  edits: Partial<Omit<Tournament, "id" | "createdAt" | "createdBy">>
) {
  await updateDoc(doc(db, "tournaments", id), {
    ...edits,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTournament(id: string) {
  await deleteDoc(doc(db, "tournaments", id));
}
