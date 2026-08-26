import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { transformImage } from "@/lib/services/cloudinary";
import type { Tournament } from "@/lib/types";

function formatDate(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return value;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {tournament.imageURL && (
        // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
        <img
          src={transformImage(tournament.imageURL, { width: 800, height: 300 })}
          alt=""
          className="h-36 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-heading text-lg font-semibold text-navy">
          {tournament.name}
        </h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={12} /> {formatDate(tournament.startDate)}
          </span>
          {tournament.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} /> {tournament.venue}
            </span>
          )}
        </div>
        {tournament.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
            {tournament.description}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy group-hover:text-gold-dark">
          View fixtures &amp; table <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
