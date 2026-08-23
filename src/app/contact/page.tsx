import { Mail, MapPin } from "lucide-react";
import { CLUB_NAME } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <PageHeader
        title="Contact Us"
        description={`Have questions about ${CLUB_NAME}? Reach out through any of the channels below.`}
      />
      <div className="flex flex-col gap-4">
        <div className="card flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
            <Mail size={18} />
          </span>
          <div>
            <p className="font-medium text-navy">Email</p>
            <p className="text-sm text-muted">iubcricketclub@iub.edu.bd</p>
          </div>
        </div>
        <div className="card flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy">
            <MapPin size={18} />
          </span>
          <div>
            <p className="font-medium text-navy">Campus</p>
            <p className="text-sm text-muted">
              Independent University, Bangladesh — Bashundhara Campus, Dhaka
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
