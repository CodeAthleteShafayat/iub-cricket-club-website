"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Info,
  LayoutDashboard,
  Newspaper,
  Trophy,
  Users,
} from "lucide-react";
import AdminGuard from "@/components/auth/AdminGuard";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/admin/matches", label: "Matches", icon: CalendarDays },
  { href: "/admin/posts", label: "Posts", icon: Newspaper },
  { href: "/admin/about", label: "About", icon: Info },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AdminGuard>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((tab) => {
            const active =
              tab.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex shrink-0 items-center gap-2 px-3 py-3 text-sm font-medium transition ${
                  active ? "text-navy" : "text-muted hover:text-navy"
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-0.5 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </AdminGuard>
  );
}
