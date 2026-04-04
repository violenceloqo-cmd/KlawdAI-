"use client";

import { ChatArea } from "@/components/chat/ChatArea";
import { useAppUser } from "@/components/app/AppShell";

export default function HomePage() {
  const user = useAppUser();
  if (!user) return null;
  return <ChatArea user={user} />;
}
