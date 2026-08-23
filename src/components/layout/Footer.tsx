import Image from "next/image";
import Link from "next/link";
import { CLUB_NAME } from "@/lib/constants";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Team" },
  { href: "/posts", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-navy-dark text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          <div>
            <p className="text-sm font-semibold text-white">{CLUB_NAME}</p>
            <p className="text-xs text-white/50">
              Independent University, Bangladesh
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-gold-light">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} {CLUB_NAME}
        </p>
      </div>
    </footer>
  );
}
