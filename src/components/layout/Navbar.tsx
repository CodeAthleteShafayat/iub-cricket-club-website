"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, User, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { CLUB_NAME } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/posts", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, member, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    ...NAV_LINKS,
    ...(member?.status === "approved"
      ? [{ href: "/community", label: "Community" }]
      : []),
    ...(member?.isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-dark/95 backdrop-blur supports-[backdrop-filter]:bg-navy-dark/85">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            {CLUB_NAME}
          </span>
        </Link>

        <ul className="hidden items-center gap-1 text-sm font-medium md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`relative rounded-md px-3 py-2 transition ${
                    active
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      className="absolute inset-x-3 -bottom-[1px] h-[3px] rounded-full"
                      style={{
                        background:
                          "repeating-linear-gradient(90deg, var(--gold) 0, var(--gold) 3px, transparent 3px, transparent 5px)",
                      }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 text-sm md:flex">
          {loading ? null : user ? (
            <>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-medium text-white transition hover:border-gold-light/50 hover:bg-white/10"
              >
                <User size={15} />
                Profile
              </Link>
              <button
                onClick={async () => {
                  await signOut(auth);
                  router.push("/");
                }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-light to-gold px-4 py-2 font-semibold text-navy-dark transition hover:from-gold hover:to-gold-dark"
              >
                Log out
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-medium text-white/70 hover:text-white"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-accent !px-4 !py-2 text-sm">
                Join
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-white md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-white/10 bg-navy-dark px-4 pb-4 md:hidden">
          <ul className="flex flex-col gap-1 pt-2 text-sm font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-white hover:bg-white/10"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
            {loading ? null : user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Profile
                </Link>
                <button
                  onClick={async () => {
                    await signOut(auth);
                    setMenuOpen(false);
                    router.push("/");
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-b from-gold-light to-gold px-5 py-2.5 text-sm font-semibold text-navy-dark transition hover:from-gold hover:to-gold-dark"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="btn-accent w-full"
                >
                  Join
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
