import { MapPin } from "lucide-react";
import { formatInnings } from "@/lib/cricket/standings";
import { toJsDate } from "@/lib/utils/bst";
import type { Match } from "@/lib/types";

// Match times are stored as Firestore Timestamps and rendered in Bangladesh
// time, matching how the rest of the site treats dates.
function formatMatchTime(value: unknown): string {
  const date = toJsDate(value);
  if (!date) return "Date to be confirmed";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export default function FixtureRow({ match }: { match: Match }) {
  const played = match.status === "completed";
  const abandoned = match.status === "abandoned";

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
          {formatMatchTime(match.startAt)}
          {match.group && (
            <span className="rounded-full bg-navy/5 px-2 py-0.5 font-semibold text-navy">
              {match.group}
            </span>
          )}
        </span>
        {abandoned && (
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-muted">
            Abandoned
          </span>
        )}
        {!played && !abandoned && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-navy">
            Upcoming
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {played ? (
          <>
            <span className="font-medium text-navy">
              {formatInnings(match.teamA, match.inningsA)}
            </span>
            <span className="font-medium text-navy">
              {formatInnings(match.teamB, match.inningsB)}
            </span>
          </>
        ) : (
          <span className="font-medium text-navy">
            {match.teamA} <span className="text-muted">vs</span> {match.teamB}
          </span>
        )}
      </div>

      {match.resultText && (
        <p className="mt-2 text-sm font-medium text-gold-dark">{match.resultText}</p>
      )}

      {match.venue && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={12} /> {match.venue}
        </p>
      )}
    </div>
  );
}
