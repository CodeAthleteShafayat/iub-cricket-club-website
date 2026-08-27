import Link from "next/link";
import { Folder, Images, Trophy } from "lucide-react";
import { transformImage } from "@/lib/services/cloudinary";
import { UNCATEGORISED } from "@/lib/services/albums";
import type { Album, Tournament } from "@/lib/types";

function Tile({
  href,
  name,
  count,
  coverImageURL,
  tournamentName,
}: {
  href: string;
  name: string;
  count: number | null;
  coverImageURL: string | null;
  tournamentName?: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full bg-navy/5">
        {coverImageURL ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
          <img
            src={transformImage(coverImageURL, { width: 600, height: 450 })}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-navy/30">
            <Folder size={34} />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-heading text-sm font-semibold text-navy group-hover:text-gold-dark">
          {name}
        </h3>
        {tournamentName && (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-navy/5 px-2 py-0.5 text-xs font-medium text-navy">
            <Trophy size={11} /> {tournamentName}
          </span>
        )}
        {count !== null && (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Images size={12} />
            {count} photo{count === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function AlbumGrid({
  albums,
  tournaments,
  uncategorisedCount,
}: {
  albums: Album[];
  tournaments: Tournament[];
  /** Null while still unknown, so the tile doesn't flash "0 photos". */
  uncategorisedCount: number | null;
}) {
  const tournamentName = (id: string | null) =>
    id ? tournaments.find((t) => t.id === id)?.name : undefined;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <Tile
          key={album.id}
          href={`/gallery/${album.id}`}
          name={album.name}
          count={album.photoCount ?? 0}
          coverImageURL={album.coverImageURL ?? null}
          tournamentName={tournamentName(album.tournamentId ?? null)}
        />
      ))}

      {/* Always shown when it has photos, so the pre-album uploads stay
          reachable rather than silently disappearing behind the new grouping. */}
      {(uncategorisedCount === null || uncategorisedCount > 0) && (
        <Tile
          href={`/gallery/${UNCATEGORISED}`}
          name="Uncategorised"
          count={uncategorisedCount}
          coverImageURL={null}
        />
      )}
    </div>
  );
}
