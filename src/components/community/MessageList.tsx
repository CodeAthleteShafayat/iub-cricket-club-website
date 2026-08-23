import type { CommunityMessage } from "@/lib/types";

export default function MessageList({
  messages,
  currentUid,
}: {
  messages: CommunityMessage[];
  currentUid?: string;
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
            className={`flex max-w-[85%] flex-col rounded-xl px-3.5 py-2.5 text-sm sm:max-w-[75%] ${
              isOwn
                ? "self-end rounded-br-sm bg-navy text-white"
                : "self-start rounded-bl-sm bg-surface text-foreground"
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isOwn ? "text-gold-light" : "text-navy"
              }`}
            >
              {m.authorName}
            </span>
            <span className="mt-0.5 whitespace-pre-wrap">{m.text}</span>
          </div>
        );
      })}
    </div>
  );
}
