"use client";

import Link from "next/link";
import { ArrowRight, Image as ImageIcon, Newspaper } from "lucide-react";
import { CLUB_NAME } from "@/lib/constants";
import FeaturedPhotos from "@/components/home/FeaturedPhotos";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Home() {
  const { user, member } = useAuth();
  const firstName = member?.name?.split(" ")[0];

  return (
    <div>
      <section className="relative isolate min-h-[560px] overflow-hidden bg-navy-dark sm:min-h-[640px]">
        {/* full-bleed sliding club photos behind the branding */}
        <FeaturedPhotos variant="cover" />

        {/* navy overlay so the branding stays legible over any photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-dark/85 via-navy-dark/75 to-navy-dark/90" />
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 15% 20%, rgba(201,154,46,0.25), transparent 60%), radial-gradient(500px circle at 85% 80%, rgba(201,154,46,0.15), transparent 60%)",
          }}
        />
        {/* cricket-ball seam, drawn once, huge and faint, as the hero's signature mark */}
        <svg
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] opacity-[0.08] sm:h-[560px] sm:w-[560px]"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="96" stroke="var(--gold)" strokeWidth="1.5" />
          <path
            d="M22 45 Q100 20 178 45 M22 155 Q100 180 178 155"
            stroke="var(--gold)"
            strokeWidth="1.5"
            strokeDasharray="3 5"
          />
        </svg>

        <div className="relative z-10 mx-auto flex min-h-[560px] max-w-5xl flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:min-h-[640px] sm:py-32">
          <span
            className="animate-fade-up rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-heading text-xs font-medium tracking-[0.15em] text-gold-light"
            style={{ animationDelay: "0.05s" }}
          >
            INDEPENDENT UNIVERSITY, BANGLADESH
          </span>
          <h1
            className="animate-fade-up max-w-3xl font-heading text-5xl font-extrabold tracking-tight text-white sm:text-7xl"
            style={{ animationDelay: "0.15s" }}
          >
            {CLUB_NAME}
          </h1>
          <p
            className="animate-fade-up max-w-xl text-base text-white/70 sm:text-lg"
            style={{ animationDelay: "0.28s" }}
          >
            {user && firstName
              ? `Welcome back, ${firstName}. Glad to have you with the club.`
              : "Bringing together students who share a passion for cricket, from weekend practice sessions to inter-university tournaments."}
          </p>
          <div
            className="animate-fade-up mt-4 flex flex-wrap justify-center gap-4"
            style={{ animationDelay: "0.4s" }}
          >
            {user ? (
              <>
                <Link href="/profile" className="btn-accent">
                  View Profile
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/posts"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gold-light/50 hover:bg-white/10"
                >
                  Latest News
                </Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="btn-accent">
                  Become a Member
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-gold-light/50 hover:bg-white/10"
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>

        <span className="seam absolute inset-x-0 bottom-0 z-10 opacity-70" />
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mb-12 flex flex-col gap-4">
          <span className="section-eyebrow">Around the club</span>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Explore the club
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <HighlightCard
            index="01"
            icon={<Newspaper size={20} />}
            title="News & Announcements"
            description="Match schedules, results, and club updates."
            href="/posts"
          />
          <HighlightCard
            index="02"
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
  index,
  icon,
  title,
  description,
  href,
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card group flex flex-col gap-5 p-6 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-md bg-navy/5 text-navy transition group-hover:bg-gold group-hover:text-navy-dark">
          {icon}
        </span>
        <span className="font-heading text-sm text-border group-hover:text-gold-dark/50">
          {index}
        </span>
      </div>
      <div>
        <h3 className="font-heading text-lg font-semibold text-navy">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </Link>
  );
}
