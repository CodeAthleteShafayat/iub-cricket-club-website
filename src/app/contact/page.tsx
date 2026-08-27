import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { CLUB_NAME } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Get in touch with the ${CLUB_NAME} at Independent University, Bangladesh — email the club office, find us on campus, or reach out on social media.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact ${CLUB_NAME}`,
    description: `Get in touch with the ${CLUB_NAME} at Independent University, Bangladesh.`,
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <PageHeader
        title="Contact Us"
        description={`Have questions about ${CLUB_NAME}? Reach out through any of the channels below.`}
      />
      <div className="flex flex-col gap-4">
        <a
          href="mailto:cricket.club@iub.edu.bd"
          className="card flex items-start gap-4 p-5 transition hover:border-navy/30"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
            <Mail size={18} />
          </span>
          <div>
            <p className="font-medium text-navy">Email</p>
            <p className="text-sm text-muted">cricket.club@iub.edu.bd</p>
          </div>
        </a>
        <a
          href="https://m.me/iubcricketclub"
          target="_blank"
          rel="noopener noreferrer"
          className="card flex items-start gap-4 p-5 transition hover:border-navy/30"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
            <MessageCircle size={18} />
          </span>
          <div>
            <p className="font-medium text-navy">Messenger</p>
            <p className="text-sm text-muted">
              Chat with us on the IUB Cricket Club Facebook page
            </p>
          </div>
        </a>
        <div className="card flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
            <MapPin size={18} />
          </span>
          <div>
            <p className="font-medium text-navy">Campus</p>
            <p className="text-sm text-muted">
              Independent University, Bangladesh, Bashundhara Campus, Dhaka
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
