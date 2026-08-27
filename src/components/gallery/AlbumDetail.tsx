"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getAlbum, subscribeToAlbums, UNCATEGORISED } from "@/lib/services/albums";
import { deleteAlbumKeepingPhotos, subscribeToAlbumImages } from "@/lib/services/gallery";
import { subscribeToTournaments } from "@/lib/services/tournaments";
import Spinner from "@/components/ui/Spinner";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import PhotoUploader from "@/components/gallery/PhotoUploader";
import AlbumForm from "@/components/gallery/AlbumForm";
import type { Album, GalleryImage, Tournament } from "@/lib/types";

export default function AlbumDetail({ albumId }: { albumId: string }) {
  const router = useRouter();
  const { member } = useAuth();
  const isUncategorised = albumId === UNCATEGORISED;
  const realAlbumId = isUncategorised ? null : albumId;

  // undefined = loading, null = not found. Uncategorised has no document, so
  // it short-circuits to null without a lookup.
  const [album, setAlbum] = useState<Album | null | undefined>(
    isUncategorised ? null : undefined
  );
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isUncategorised) return;
    getAlbum(albumId).then(setAlbum).catch(() => setAlbum(null));
  }, [albumId, isUncategorised]);

  useEffect(
    () =>
      subscribeToAlbumImages(
        realAlbumId,
        setImages,
        () => setError("Could not load photos. Please refresh in a moment.")
      ),
    [realAlbumId]
  );

  useEffect(() => subscribeToAlbums(setAllAlbums), []);
  useEffect(() => subscribeToTournaments(setTournaments), []);

  const tournamentName = useMemo(
    () =>
      album?.tournamentId
        ? tournaments.find((t) => t.id === album.tournamentId)?.name
        : undefined,
    [album, tournaments]
  );

  async function handleDeleteAlbum() {
    if (!album) return;
    const count = images.length;
    const warning =
      count > 0
        ? `Delete the album "${album.name}"?\n\nIts ${count} photo${count === 1 ? "" : "s"} will NOT be deleted. They move to Uncategorised so you can re-file them.`
        : `Delete the empty album "${album.name}"?`;
    if (!confirm(warning)) return;

    setDeleting(true);
    try {
      await deleteAlbumKeepingPhotos(album.id);
      router.push("/gallery");
    } catch {
      setError("Could not delete the album. Please try again.");
      setDeleting(false);
    }
  }

  if (album === undefined) return <Spinner />;

  if (!isUncategorised && album === null) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <p className="text-sm text-muted">Album not found.</p>
        <Link href="/gallery" className="mt-4 inline-block text-sm font-medium text-navy underline">
          Back to albums
        </Link>
      </div>
    );
  }

  const title = isUncategorised ? "Uncategorised" : album!.name;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Link
        href="/gallery"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-navy"
      >
        <ArrowLeft size={14} /> All albums
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            {title}
          </h1>
          {tournamentName && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-medium text-navy">
              <Trophy size={11} /> {tournamentName}
            </span>
          )}
          {!isUncategorised && album!.description && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              {album!.description}
            </p>
          )}
          {isUncategorised && (
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Photos that aren&apos;t in an album yet.
              {member?.isAdmin && " Use the move button on a photo to file it."}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            {images.length} photo{images.length === 1 ? "" : "s"}
          </p>
        </div>

        {member?.isAdmin && !isUncategorised && !editing && (
          <div className="flex shrink-0 gap-3 text-sm">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 font-medium text-navy hover:underline"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={handleDeleteAlbum}
              disabled={deleting}
              className="flex items-center gap-1 font-medium text-red-600 hover:underline"
            >
              <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete album"}
            </button>
          </div>
        )}
      </div>

      {member?.isAdmin && editing && album && (
        <div className="mb-6">
          <AlbumForm
            existingAlbum={album}
            onDone={() => {
              setEditing(false);
              // Re-read so the header reflects a renamed album immediately.
              getAlbum(album.id).then(setAlbum).catch(() => {});
            }}
          />
        </div>
      )}

      {member?.isAdmin && (
        <div className="mb-6">
          <PhotoUploader albumId={realAlbumId} />
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <PhotoGrid images={images} albums={allAlbums} currentAlbumId={realAlbumId} />
    </div>
  );
}
