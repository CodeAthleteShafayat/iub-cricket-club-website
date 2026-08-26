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
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { InningsResult, Match } from "@/lib/types";

export interface MatchInput {
  tournamentId: string | null;
  teamA: string;
  teamB: string;
  venue: string;
  startAt: Date;
  oversPerInnings: number;
  updatedBy: string;
}

export async function createMatch(input: MatchInput) {
  const { startAt, ...rest } = input;
  await addDoc(collection(db, "matches"), {
    ...rest,
    startAt,
    status: "scheduled",
    // Explicit nulls rather than absent fields, so reads have a consistent
    // shape and the standings code never has to distinguish the two.
    inningsA: null,
    inningsB: null,
    outcome: null,
    battedFirst: null,
    resultText: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Live list of matches, optionally scoped to one tournament.
 *
 * The tournamentId + startAt combination needs the composite index declared in
 * firestore.indexes.json -- without it this throws failed-precondition at
 * runtime only, never at build time.
 */
export function subscribeToMatches(
  callback: (matches: Match[]) => void,
  options?: { tournamentId?: string; onError?: (error: Error) => void }
) {
  const base = collection(db, "matches");
  const q = options?.tournamentId
    ? query(
        base,
        where("tournamentId", "==", options.tournamentId),
        orderBy("startAt", "asc")
      )
    : query(base, orderBy("startAt", "desc"));

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match));
    },
    (error) => options?.onError?.(error)
  );
}

/**
 * Matches that belong to no tournament (standalone friendlies).
 *
 * Without this they'd be creatable in admin but invisible on the public site.
 * Uses the same tournamentId + startAt composite index as the scoped query --
 * null is a valid value for an equality filter.
 */
export function subscribeToFriendlies(
  callback: (matches: Match[]) => void,
  onError?: (error: Error) => void
) {
  const q = query(
    collection(db, "matches"),
    where("tournamentId", "==", null),
    orderBy("startAt", "asc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Match));
    },
    (error) => onError?.(error)
  );
}

export async function getMatch(id: string): Promise<Match | null> {
  const snap = await getDoc(doc(db, "matches", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Match) : null;
}

export async function updateMatch(
  id: string,
  edits: Partial<Pick<Match, "tournamentId" | "teamA" | "teamB" | "venue" | "oversPerInnings">> & {
    startAt?: Date;
  }
) {
  await updateDoc(doc(db, "matches", id), {
    ...edits,
    updatedAt: serverTimestamp(),
  });
}

export interface MatchResultInput {
  inningsA: InningsResult;
  inningsB: InningsResult;
  outcome: NonNullable<Match["outcome"]>;
  battedFirst: NonNullable<Match["battedFirst"]>;
  resultText: string;
  status: Extract<Match["status"], "completed" | "abandoned">;
  updatedBy: string;
}

/** Writes the post-match result. Everything the points table reads comes from here. */
export async function saveMatchResult(id: string, input: MatchResultInput) {
  await updateDoc(doc(db, "matches", id), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

/** Clears a result, putting the match back to scheduled. */
export async function clearMatchResult(id: string, updatedBy: string) {
  await updateDoc(doc(db, "matches", id), {
    status: "scheduled",
    inningsA: null,
    inningsB: null,
    outcome: null,
    battedFirst: null,
    resultText: null,
    updatedBy,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMatch(id: string) {
  await deleteDoc(doc(db, "matches", id));
}
