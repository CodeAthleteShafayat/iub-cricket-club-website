import { Check, X } from "lucide-react";
import { transformImage } from "@/lib/services/cloudinary";
import { PLAYING_EXPERIENCE_OPTIONS } from "@/lib/constants";
import type { Member } from "@/lib/types";

export default function MemberReviewCard({
  member,
  windowOpen,
  onApprove,
  onReject,
}: {
  member: Member;
  windowOpen: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const experienceLabel =
    PLAYING_EXPERIENCE_OPTIONS.find((e) => e.value === member.playingExperience)?.label ??
    member.playingExperience;

  return (
    <div className="card flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-navy/5">
          {member.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL
            <img
              src={transformImage(member.photoURL, { width: 96, height: 96 })}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div>
          <div className="font-medium text-navy">{member.name}</div>
          <div className="text-muted">
            {member.studentId} · {member.department} · {member.semester}{" "}
            {member.year} · {member.role}
          </div>
          <div className="text-muted">
            {member.email} · {member.phone}
          </div>
          <div className="text-muted">
            DOB: {member.dateOfBirth || "—"} · Blood group: {member.bloodGroup || "—"} ·{" "}
            {experienceLabel}
          </div>
          {member.cricketingAchievements && (
            <div className="text-muted">Achievements: {member.cricketingAchievements}</div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onApprove}
          disabled={!windowOpen}
          title={windowOpen ? undefined : "Recruitment window is closed"}
          className="btn-primary !px-3 !py-1.5 text-xs"
        >
          <Check size={14} /> Approve
        </button>
        <button
          onClick={onReject}
          className="btn-outline !px-3 !py-1.5 text-xs"
        >
          <X size={14} /> Reject
        </button>
      </div>
    </div>
  );
}
