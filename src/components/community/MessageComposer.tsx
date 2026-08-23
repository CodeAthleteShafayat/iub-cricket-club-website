"use client";

import { useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { sendMessage } from "@/lib/services/community";

export default function MessageComposer() {
  const { user, member } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!user || !member || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        authorUid: user.uid,
        authorName: member.name,
        authorPhotoURL: member.photoURL,
        text: text.trim(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSend}
      className="flex gap-2 border-t border-border p-3"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a message..."
        className="input flex-1"
      />
      <button
        type="submit"
        disabled={sending || !text.trim()}
        className="btn-primary !px-4"
        aria-label="Send"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
