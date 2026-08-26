import type { InningsResult, Match, StandingsRow, Tournament } from "@/lib/types";

// Pure cricket logic: no Firestore imports, no React, no side effects. Kept
// separate so the scoring rules can be read and verified on their own, and so
// the same helpers can be reused if live scoring is added later.

const BALLS_PER_OVER = 6;

/** 98 -> "16.2". Overs are base-6, so this is integer division, not a decimal. */
export function formatOvers(balls: number): string {
  const safe = Math.max(0, Math.floor(balls));
  return `${Math.floor(safe / BALLS_PER_OVER)}.${safe % BALLS_PER_OVER}`;
}

/** Overs as a real number, for rate arithmetic only. 98 -> 16.333... */
export function oversAsDecimal(balls: number): number {
  return balls / BALLS_PER_OVER;
}

/**
 * Parses what an admin types into a legal-balls integer.
 * Accepts "16.2" (16 overs 2 balls), "16", or "16.0".
 * Returns null for anything malformed, including a ball part above 5 —
 * "16.6" is not a real score, the over would have ended.
 */
export function ballsFromOversInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (!/^\d+(\.\d)?$/.test(trimmed)) return null;

  const [oversPart, ballsPart = "0"] = trimmed.split(".");
  const overs = Number(oversPart);
  const balls = Number(ballsPart);
  if (balls >= BALLS_PER_OVER) return null;

  return overs * BALLS_PER_OVER + balls;
}

/** Cricket tables render NRR to 3 decimals with an explicit sign. */
export function formatNrr(nrr: number | null): string {
  if (nrr === null || !Number.isFinite(nrr)) return "—";
  const sign = nrr > 0 ? "+" : nrr < 0 ? "−" : "";
  return `${sign}${Math.abs(nrr).toFixed(3)}`;
}

/**
 * Overs a team is *charged* for net run rate purposes.
 *
 * The all-out rule: a side bowled out is charged its full quota, not the overs
 * it actually lasted. Without this, collapsing cheaply would improve your NRR,
 * which is backwards — losing 10 wickets in 15 overs is worse than surviving
 * 20, and the maths has to reflect that.
 */
function chargedOvers(innings: InningsResult, oversPerInnings: number): number {
  if (innings.wickets >= 10) return oversPerInnings;
  return oversAsDecimal(innings.balls);
}

/** A match contributes to the table only once it has a recorded outcome. */
function isCounted(match: Match): boolean {
  return match.status === "completed" || match.status === "abandoned";
}

/**
 * A match feeds net run rate only when both innings were actually played out.
 * An abandoned or no-result match still counts as "played" for points, but
 * folding a rain-shortened partial innings into a rate would distort it.
 */
function countsForNrr(match: Match): boolean {
  return (
    match.status === "completed" &&
    match.outcome !== "no-result" &&
    match.inningsA !== null &&
    match.inningsB !== null
  );
}

interface Accumulator {
  team: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  hasNrrData: boolean;
}

function blankRow(team: string): Accumulator {
  return {
    team,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    points: 0,
    runsScored: 0,
    runsConceded: 0,
    oversFaced: 0,
    oversBowled: 0,
    hasNrrData: false,
  };
}

/**
 * Builds the points table from a tournament's matches.
 *
 * Derived on every read rather than stored: recomputing is free (the caller
 * already has the matches loaded for the fixtures list) and it can never drift
 * out of sync with the results it summarises.
 */
export function computeStandings(
  matches: Match[],
  tournament: Pick<Tournament, "pointsForWin" | "pointsForTie" | "oversPerInnings">
): StandingsRow[] {
  const table = new Map<string, Accumulator>();

  const rowFor = (team: string) => {
    const key = team.trim();
    if (!table.has(key)) table.set(key, blankRow(key));
    return table.get(key)!;
  };

  for (const match of matches) {
    if (!isCounted(match)) continue;
    if (!match.teamA?.trim() || !match.teamB?.trim()) continue;

    const a = rowFor(match.teamA);
    const b = rowFor(match.teamB);

    a.played += 1;
    b.played += 1;

    // An abandoned match has no outcome recorded; treat it as a shared result,
    // which is how tournaments normally handle a washout.
    const outcome = match.status === "abandoned" ? "no-result" : match.outcome;

    if (outcome === "A") {
      a.won += 1;
      b.lost += 1;
      a.points += tournament.pointsForWin;
    } else if (outcome === "B") {
      b.won += 1;
      a.lost += 1;
      b.points += tournament.pointsForWin;
    } else {
      // tie, no-result, abandoned, or a completed match missing its outcome
      a.tied += 1;
      b.tied += 1;
      a.points += tournament.pointsForTie;
      b.points += tournament.pointsForTie;
    }

    if (countsForNrr(match)) {
      const oversPerInnings = match.oversPerInnings || tournament.oversPerInnings;
      const inningsA = match.inningsA!;
      const inningsB = match.inningsB!;

      a.runsScored += inningsA.runs;
      a.oversFaced += chargedOvers(inningsA, oversPerInnings);
      a.runsConceded += inningsB.runs;
      a.oversBowled += chargedOvers(inningsB, oversPerInnings);
      a.hasNrrData = true;

      b.runsScored += inningsB.runs;
      b.oversFaced += chargedOvers(inningsB, oversPerInnings);
      b.runsConceded += inningsA.runs;
      b.oversBowled += chargedOvers(inningsA, oversPerInnings);
      b.hasNrrData = true;
    }
  }

  const rows: StandingsRow[] = [...table.values()].map((acc) => {
    // Guard both divisions: a team can legitimately have 0 overs on one side
    // (e.g. every innings it faced was abandoned), and Infinity would sort to
    // the top of the table.
    const canComputeNrr = acc.hasNrrData && acc.oversFaced > 0 && acc.oversBowled > 0;
    const nrr = canComputeNrr
      ? acc.runsScored / acc.oversFaced - acc.runsConceded / acc.oversBowled
      : null;

    return {
      team: acc.team,
      played: acc.played,
      won: acc.won,
      lost: acc.lost,
      tied: acc.tied,
      points: acc.points,
      nrr,
      runsScored: acc.runsScored,
      runsConceded: acc.runsConceded,
    };
  });

  return rows.sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    // Teams without an NRR yet sort below those with one, rather than being
    // treated as 0.000 and jumping above a team with a negative rate.
    const xn = x.nrr ?? Number.NEGATIVE_INFINITY;
    const yn = y.nrr ?? Number.NEGATIVE_INFINITY;
    if (yn !== xn) return yn - xn;
    if (y.won !== x.won) return y.won - x.won;
    return x.team.localeCompare(y.team);
  });
}

export interface GroupStandings {
  /** The group name, or null for the single combined table of an ungrouped
   *  tournament. */
  group: string | null;
  rows: StandingsRow[];
}

/**
 * One points table per group, or a single combined table when the tournament
 * has no groups.
 *
 * Matches with no group are deliberately excluded once a tournament defines
 * groups: those are the knockout and final fixtures, and a semi-final must not
 * add points to a group table. In an ungrouped tournament there is nothing to
 * exclude, so every match counts.
 */
export function computeStandingsByGroup(
  matches: Match[],
  tournament: Pick<
    Tournament,
    "pointsForWin" | "pointsForTie" | "oversPerInnings" | "groups"
  >
): GroupStandings[] {
  const groups = tournament.groups ?? [];

  if (groups.length === 0) {
    return [{ group: null, rows: computeStandings(matches, tournament) }];
  }

  return groups.map((group) => ({
    group,
    rows: computeStandings(
      matches.filter((m) => m.group === group),
      tournament
    ),
  }));
}

/** Matches outside the group stage, shown as a separate knockout section. */
export function knockoutMatches(
  matches: Match[],
  tournament: Pick<Tournament, "groups">
): Match[] {
  if ((tournament.groups ?? []).length === 0) return [];
  return matches.filter((m) => !m.group);
}

/**
 * Proposes the result line for a finished match. The admin can edit it before
 * saving — this only saves typing for the common cases.
 *
 * Assumes the side batting second is whichever innings is the chase; for a
 * simple two-innings club match that's inningsB by construction.
 */
export function suggestResultText(match: Match): string {
  const { inningsA, inningsB, teamA, teamB, outcome, oversPerInnings, battedFirst } = match;
  if (!inningsA || !inningsB) return "";

  if (outcome === "tie") return "Match tied";
  if (outcome === "no-result") return "No result";
  if (outcome !== "A" && outcome !== "B") return "";

  // Which margin to quote depends on batting order, not on who won: a side
  // that defended a total wins by runs, a side that chased wins by wickets.
  // This can't be inferred from the scores, so it has to be recorded.
  // Older matches saved before battedFirst existed fall back to A batting
  // first, which was the previous (silently wrong for B-first games) behaviour.
  const first = battedFirst ?? "A";
  const chasingSide = first === "A" ? "B" : "A";

  const winnerName = outcome === "A" ? teamA : teamB;
  const winnerInnings = outcome === "A" ? inningsA : inningsB;
  const loserInnings = outcome === "A" ? inningsB : inningsA;

  if (outcome === chasingSide) {
    const wicketsLeft = 10 - winnerInnings.wickets;
    const ballsLeft = oversPerInnings * BALLS_PER_OVER - winnerInnings.balls;
    const tail =
      ballsLeft > 0 ? ` (${ballsLeft} ball${ballsLeft === 1 ? "" : "s"} remaining)` : "";
    return `${winnerName} won by ${wicketsLeft} wicket${wicketsLeft === 1 ? "" : "s"}${tail}`;
  }

  const margin = winnerInnings.runs - loserInnings.runs;
  return `${winnerName} won by ${margin} run${margin === 1 ? "" : "s"}`;
}

/** "IUB 178/4 (18.2)" — the compact innings line used in lists and results. */
export function formatInnings(team: string, innings: InningsResult | null): string {
  if (!innings) return team;
  return `${team} ${innings.runs}/${innings.wickets} (${formatOvers(innings.balls)})`;
}
