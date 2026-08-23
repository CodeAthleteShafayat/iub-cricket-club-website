"use client";

import { useEffect, useRef, useState } from "react";
import ApprovedGuard from "@/components/auth/ApprovedGuard";
import MessageList from "@/components/community/MessageList";
import MessageComposer from "@/components/community/MessageComposer";
import { subscribeToMessages } from "@/lib/services/community";
import { useAuth } from "@/lib/auth/AuthContext";
import type { CommunityMessage } from "@/lib/types";

function CommunityContent() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeToMessages(setMessages), []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-6 sm:py-8">
      <h1 className="text-xl font-bold tracking-tight text-navy sm:text-2xl">
        Community
      </h1>
      <div className="card mt-4 flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList messages={messages} currentUid={user?.uid} />
          <div ref={bottomRef} />
        </div>
        <MessageComposer />
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <ApprovedGuard>
      <CommunityContent />
    </ApprovedGuard>
  );
}
