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
import PhotoGrid from "@/components/gallery/PhotoGrid";
import PhotoUploader from "@/components/gallery/PhotoUploader";
import type { Album, GalleryImage, Tournament } from "@/lib/types";

export default function GalleryPage() {
  const { member } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  // Photos that aren't in an album. Shown inline underneath the albums rather
  // than behind an "Uncategorised" tile, which read like a database state
  // rather than part of a gallery.
  const [looseImages, setLooseImages] = useState<GalleryImage[]>([]);
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

  useEffect(
    () =>
      subscribeToAlbumImages(null, setLooseImages, () =>
        setError("Could not load photos. Please refresh in a moment.")
      ),
    []
  );

  const isAdmin = !!member?.isAdmin;
  const nothingYet = albums.length === 0 && looseImages.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <PageHeader
        title="Gallery"
        description={
          isAdmin
            ? "Photos grouped into albums. Create an album, then open it to add photos. Star a photo to feature it on the homepage."
            : "Photos from practices, matches, and tournaments."
        }
      />

      {isAdmin && !creating && (
        <button onClick={() => setCreating(true)} className="btn-primary mb-6 w-full sm:w-fit">
          <Plus size={16} /> New album
        </button>
      )}

      {isAdmin && creating && (
        <div className="mb-6">
          <AlbumForm onDone={() => setCreating(false)} />
        </div>
      )}

      {loading && <p className="text-sm text-muted">Loading gallery...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && nothingYet && (
        <p className="text-sm text-muted">No photos yet.</p>
      )}

      {!loading && !error && albums.length > 0 && (
        <AlbumGrid albums={albums} tournaments={tournaments} />
      )}

      {/* Loose photos always sit below the albums, so the organised content
          leads and these read as the rest of the gallery rather than as a
          leftover bucket. */}
      {!loading && !error && (looseImages.length > 0 || isAdmin) && (
        <section className={albums.length > 0 ? "mt-12" : ""}>
          {albums.length > 0 && looseImages.length > 0 && (
            <h2 className="section-eyebrow mb-4">More photos</h2>
          )}

          {isAdmin && (
            <div className="mb-5">
              <PhotoUploader albumId={null} />
              <p className="mt-1.5 text-xs text-muted">
                Photos added here sit outside any album. To group them, open an
                album and upload there, or use the move button on a photo.
              </p>
            </div>
          )}

          {looseImages.length > 0 && (
            <PhotoGrid images={looseImages} albums={albums} currentAlbumId={null} />
          )}
        </section>
      )}
    </div>
  );
}
