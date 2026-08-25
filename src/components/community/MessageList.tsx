import { Trash2 } from "lucide-react";
import type { CommunityMessage } from "@/lib/types";

export default function MessageList({
  messages,
  currentUid,
  canDelete,
  onDelete,
}: {
  messages: CommunityMessage[];
  currentUid?: string;
  canDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted">
        No messages yet. Be the first to say hello!
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => {
        const isOwn = m.authorUid === currentUid;
        return (
          <div
            key={m.id}
            className={`group flex max-w-[85%] flex-col rounded-xl px-3.5 py-2.5 text-sm sm:max-w-[75%] ${
              isOwn
                ? "self-end rounded-br-sm bg-navy text-white"
                : "self-start rounded-bl-sm bg-surface text-foreground"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`text-xs font-medium ${
                  isOwn ? "text-gold-light" : "text-navy"
                }`}
              >
                {m.authorName}
              </span>
              {canDelete && (
                <button
                  onClick={() => {
                    if (confirm("Delete this message? This cannot be undone.")) {
                      onDelete?.(m.id);
                    }
                  }}
                  aria-label="Delete message"
                  className={`shrink-0 opacity-0 transition group-hover:opacity-100 ${
                    isOwn ? "text-white/60 hover:text-white" : "text-muted hover:text-red-600"
                  }`}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <span className="mt-0.5 whitespace-pre-wrap">{m.text}</span>
          </div>
        );
      })}
    </div>
  );
}
