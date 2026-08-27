import type { Metadata } from "next";
import { getTournamentServer } from "@/lib/services/publicContent";
import { transformImage } from "@/lib/services/cloudinary";
import { SITE_URL } from "@/lib/siteUrl";
import { CLUB_NAME } from "@/lib/constants";
import TournamentDetail from "@/components/tournaments/TournamentDetail";

// Revalidate every 10 minutes: shorter than posts because fixtures and
// results change during a live tournament, still long enough that a crawl
// doesn't hit Firestore on every request. The client component keeps its own
// live subscription, so visitors watching a match still see instant updates.
export const revalidate = 600;

function excerpt(text: string, max = 160): string {
  const flat = (text ?? "").replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}...`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}): Promise<Metadata> {
  const { tournamentId } = await params;
  const tournament = await getTournamentServer(tournamentId);

  if (!tournament) {
    return {
      title: "Tournament Not Found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    excerpt(tournament.description) ||
    `${tournament.name} — fixtures, results, and points table from the ${CLUB_NAME}.`;
  const image = tournament.imageURL
    ? transformImage(tournament.imageURL, { width: 1200, crop: "limit" })
    : undefined;

  return {
    title: tournament.name,
    description,
    alternates: { canonical: `/tournaments/${tournamentId}` },
    openGraph: {
      type: "article",
      title: tournament.name,
      description,
      url: `${SITE_URL}/tournaments/${tournamentId}`,
      ...(image ? { images: [{ url: image, alt: tournament.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: tournament.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  const tournament = await getTournamentServer(tournamentId);

  // SportsEvent rather than the generic Article type -- it lets Google
  // surface the dates and venue directly in results.
  const eventJsonLd = tournament
    ? {
        "@context": "https://schema.org",
        "@type": "SportsEvent",
        name: tournament.name,
        description: excerpt(tournament.description),
        sport: "Cricket",
        startDate: tournament.startDate || undefined,
        endDate: tournament.endDate || undefined,
        url: `${SITE_URL}/tournaments/${tournamentId}`,
        organizer: { "@type": "SportsOrganization", name: CLUB_NAME },
        ...(tournament.venue
          ? { location: { "@type": "Place", name: tournament.venue } }
          : {}),
        ...(tournament.imageURL
          ? {
              image: transformImage(tournament.imageURL, {
                width: 1200,
                crop: "limit",
              }),
            }
          : {}),
      }
    : null;

  return (
    <>
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}
      <TournamentDetail tournamentId={tournamentId} />
    </>
  );
}
