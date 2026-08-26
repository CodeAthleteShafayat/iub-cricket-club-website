import { formatNrr } from "@/lib/cricket/standings";
import type { StandingsRow } from "@/lib/types";

export default function StandingsTable({ rows }: { rows: StandingsRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        The table fills in as results are uploaded.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="w-8 px-3 py-2.5 font-semibold">#</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Team</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold" title="Played">P</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold" title="Won">W</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold" title="Lost">L</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold" title="Tied or no result">T/NR</th>
            <th scope="col" className="px-3 py-2.5 text-center font-semibold">Pts</th>
            <th scope="col" className="px-3 py-2.5 text-right font-semibold" title="Net run rate">NRR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.team} className="border-t border-border">
              <td className="px-3 py-2.5 tabular-nums text-muted">{index + 1}</td>
              <td className="px-3 py-2.5 font-medium text-navy">{row.team}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted">{row.played}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted">{row.won}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted">{row.lost}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted">{row.tied}</td>
              <td className="px-3 py-2.5 text-center font-semibold tabular-nums text-navy">
                {row.points}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted">
                {formatNrr(row.nrr)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
