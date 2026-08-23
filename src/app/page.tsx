import Link from "next/link";
import { ArrowRight, Image as ImageIcon, Newspaper, Users } from "lucide-react";
import { CLUB_NAME } from "@/lib/constants";
import FeaturedPhotos from "@/components/home/FeaturedPhotos";

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-navy-dark">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 15% 20%, rgba(201,154,46,0.25), transparent 60%), radial-gradient(500px circle at 85% 80%, rgba(201,154,46,0.15), transparent 60%)",
          }}
        />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-24 text-center sm:py-32">
          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-gold-light">
            INDEPENDENT UNIVERSITY, BANGLADESH
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {CLUB_NAME}
          </h1>
          <p className="max-w-xl text-base text-white/70 sm:text-lg">
            Bringing together students who share a passion for cricket — from
            weekend practice sessions to inter-university tournaments.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="btn-accent">
              Become a Member
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <FeaturedPhotos />

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-col gap-3">
          <span className="section-eyebrow" />
          <h2 className="text-2xl font-bold tracking-tight text-navy">
            Explore the club
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <HighlightCard
            icon={<Newspaper size={20} />}
            title="News & Announcements"
            description="Match schedules, results, and club updates."
            href="/posts"
          />
          <HighlightCard
            icon={<Users size={20} />}
            title="Meet the Team"
            description="See the current roster of approved club members."
            href="/team"
          />
          <HighlightCard
            icon={<ImageIcon size={20} />}
            title="Gallery"
            description="Photos from practices, matches, and events."
            href="/gallery"
          />
        </div>
      </section>
    </div>
  );
}

function HighlightCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col gap-4 p-6 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy/5 text-navy transition group-hover:bg-gold group-hover:text-navy-dark">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-navy">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </Link>
  );
}
