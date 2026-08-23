import Link from "next/link";
import { CLUB_NAME } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <PageHeader title={`About ${CLUB_NAME}`} />
      <div className="flex flex-col gap-4 leading-relaxed text-foreground/80">
        <p>
          {CLUB_NAME} is the official cricket club of Independent University,
          Bangladesh (IUB), bringing together students who share a passion
          for the game — from casual net sessions to representing the
          university in inter-varsity tournaments.
        </p>
        <p>
          The club organizes regular practice sessions, coaching, and
          friendly matches, and is run by a student committee with support
          from university faculty advisors.
        </p>
        <p>
          Interested in joining? Head over to the{" "}
          <Link href="/signup" className="font-medium text-navy underline">
            membership signup
          </Link>{" "}
          page to submit your application.
        </p>
      </div>
    </div>
  );
}
