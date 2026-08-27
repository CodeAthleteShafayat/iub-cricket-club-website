"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { subscribeToAlbums } from "@/lib/services/albums";
import { subscribeToAlbumImages } from "@/lib/services/gallery";
import { subscribeToTournaments } from "@/lib/services/tournaments";
import PageHeader from "@/components/ui/PageHeader";
import AlbumGrid from "@/components/gallery/AlbumGrid";
import AlbumForm from "@/components/gallery/AlbumForm";
import type { Album, Tournament } from "@/lib/types";

export default function GalleryPage() {
  const { member } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [uncategorisedCount, setUncategorisedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    return subscribeToAlbums(
      (list) => {
        setAlbums(list);
        setLoading(false);
      },
      () => {
        setError("Could not load albums. Please refresh in a moment.");
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => subscribeToTournaments(setTournaments), []);

  // Only to decide whether the Uncategorised tile is worth showing, and to
  // label it. This is the one place the gallery index still reads photos, and
  // it shrinks to zero once everything has been filed into an album.
  useEffect(
    () =>
      subscribeToAlbumImages(
        null,
        (imgs) => setUncategorisedCount(imgs.length),
        () => setUncategorisedCount(0)
      ),
    []
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <PageHeader
        title="Gallery"
        description={
          member?.isAdmin
            ? "Photos grouped into albums. Create an album, then open it to add photos. Star a photo inside an album to feature it on the homepage."
            : "Photos from practices, matches, and tournaments."
        }
      />

      {member?.isAdmin && !creating && (
        <button onClick={() => setCreating(true)} className="btn-primary mb-6 w-full sm:w-fit">
          <Plus size={16} /> New album
        </button>
      )}

      {member?.isAdmin && creating && (
        <div className="mb-6">
          <AlbumForm onDone={() => setCreating(false)} />
        </div>
      )}

      {loading && <p className="text-sm text-muted">Loading albums...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && albums.length === 0 && uncategorisedCount === 0 && (
        <p className="text-sm text-muted">No photos yet.</p>
      )}

      {!loading && !error && (
        <AlbumGrid
          albums={albums}
          tournaments={tournaments}
          uncategorisedCount={uncategorisedCount}
        />
      )}
    </div>
  );
}
