import Link from "next/link";
import { CLUB_NAME } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";
import AboutEditableSection from "@/components/about/AboutEditableSection";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <PageHeader
        title={`About ${CLUB_NAME}`}
        description={`"Where Talent Meets Excellence": the official cricket club of Independent University, Bangladesh.`}
      />
      <div className="flex flex-col gap-10 leading-relaxed text-foreground/80">
        <p>
          Operating under the Division of Student Activities (DoSA), {CLUB_NAME}{" "}
          is a cornerstone of sports and student life at IUB. The club runs a
          full development pathway for cricketers of every level: regular
          training sessions, per-semester gym and fitness sessions for
          selected squads, on-campus practice matches and tournaments, and
          representation in inter-university competitions.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold text-navy">
            Our Mission
          </h2>
          <p>
            The club helps students discover and grow their cricketing talent
            through regular training, practice matches, and guidance from
            experienced mentors, with a focus on skills, teamwork,
            leadership, and understanding of the game. Beyond cricket, it
            encourages student engagement and collaboration with university
            officials, building a strong sense of community and a lively
            cricket culture on campus.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold text-navy">
            Leadership &amp; Training
          </h2>
          <p>
            The club is guided by Mr. Maruf Reza Khan Sunny, a former First
            Class cricketer of the Bangladesh Cricket Board, and run day to
            day by a student executive committee (president, vice president,
            general secretary, joint secretary, treasurer, and other members)
            with support from DoSA officers. Training takes place at the IUB
            New Practice Ground, which has two wickets (turf and concrete)
            and a smooth outfield, and new players are recruited every
            semester.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold text-navy">
            Achievements
          </h2>
          <p>
            {CLUB_NAME} has made its mark in university cricket: champions of
            the NSU Inter-University Sports Carnival 2020 and the Barguna MP
            Cricket Tournament, runner-up in the ULAB Fair Play
            Inter-Private University Cricket Tournament 2017, and back-to-back
            2nd runner-up finishes in the ULAB Fairplay Inter-Private
            University Cricket Tournament in 2024 and 2025.
          </p>
        </section>

        <AboutEditableSection />

        <div className="card flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading text-lg font-semibold text-navy">
                Interested in joining?
              </p>
              <p className="text-sm text-muted">
                Submit your membership application to get started.
              </p>
            </div>
            <Link href="/signup" className="btn-accent shrink-0">
              Apply for Membership
            </Link>
          </div>
          <div className="h-px bg-border" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading text-lg font-semibold text-navy">
                Want the full story?
              </p>
              <p className="text-sm text-muted">
                Read more about the club on the official IUB website.
              </p>
            </div>
            <a
              href="https://iub.ac.bd/campus-life/clubs-at-iub/iub-cricket-club"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline shrink-0"
            >
              Official IUB Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
