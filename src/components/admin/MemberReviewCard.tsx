import { Check, X } from "lucide-react";
import type { Member } from "@/lib/types";

export default function MemberReviewCard({
  member,
  onApprove,
  onReject,
}: {
  member: Member;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="card flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-medium text-navy">{member.name}</div>
        <div className="text-muted">
          {member.studentId} · {member.department} · {member.batch} ·{" "}
          {member.role}
        </div>
        <div className="text-muted">
          {member.email} · {member.phone}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
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
