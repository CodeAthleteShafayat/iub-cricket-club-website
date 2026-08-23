"use client";

import { useEffect, useState } from "react";
import { subscribeToMembersByStatus } from "@/lib/services/members";
import { transformImage } from "@/lib/services/cloudinary";
import type { Member } from "@/lib/types";
import { ROLE_OPTIONS } from "@/lib/constants";
import PageHeader from "@/components/ui/PageHeader";

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToMembersByStatus("approved", (m) => {
      setMembers(m);
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <PageHeader
        title="Our Team"
        description="Current roster of approved club members."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {loading && <p className="text-sm text-muted">Loading roster...</p>}
        {!loading && members.length === 0 && (
          <p className="text-sm text-muted">No members yet.</p>
        )}
        {members.map((m) => (
          <div key={m.uid} className="card flex items-center gap-4 p-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-sm font-semibold text-gold">
              {m.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL, plain img keeps this list simple
                <img
                  src={transformImage(m.photoURL, { width: 112, height: 112 })}
                  alt={m.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {m.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-navy">{m.name}</div>
              <div className="text-sm text-muted">
                {ROLE_OPTIONS.find((r) => r.value === m.role)?.label} ·{" "}
                {m.department}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
