import Image from "next/image";
import Link from "next/link";
import { CLUB_NAME, SOCIAL_LINKS } from "@/lib/constants";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/posts", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="mt-auto bg-navy-dark text-white/70">
      <span className="seam block opacity-60" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:px-6 md:flex-row md:justify-between md:text-left">
        <div className="flex flex-col items-center gap-2.5 sm:flex-row">
          <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          <div>
            <p className="font-heading text-sm font-bold text-white">
              {CLUB_NAME}
            </p>
            <p className="text-xs text-white/50">
              Independent University, Bangladesh
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="transition hover:text-gold-light">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} {CLUB_NAME}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="IUB Cricket Club on Facebook"
              className="text-white/50 transition hover:text-gold-light"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4.5 w-4.5"
              >
                <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
              </svg>
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="IUB Cricket Club on Instagram"
              className="text-white/50 transition hover:text-gold-light"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4.5 w-4.5"
              >
                <path d="M12 2c-2.72 0-3.06.01-4.12.06-1.06.05-1.79.22-2.43.47-.66.26-1.22.6-1.77 1.16-.56.55-.9 1.11-1.16 1.77-.25.64-.42 1.37-.47 2.43C2 8.94 2 9.28 2 12s.01 3.06.06 4.12c.05 1.06.22 1.79.47 2.43.26.66.6 1.22 1.16 1.77.55.56 1.11.9 1.77 1.16.64.25 1.37.42 2.43.47C8.94 22 9.28 22 12 22s3.06-.01 4.12-.06c1.06-.05 1.79-.22 2.43-.47.66-.26 1.22-.6 1.77-1.16.56-.55.9-1.11 1.16-1.77.25-.64.42-1.37.47-2.43.05-1.06.06-1.4.06-4.12s-.01-3.06-.06-4.12c-.05-1.06-.22-1.79-.47-2.43a4.9 4.9 0 0 0-1.16-1.77 4.9 4.9 0 0 0-1.77-1.16c-.64-.25-1.37-.42-2.43-.47C15.06 2.01 14.72 2 12 2Zm0 1.8c2.67 0 2.99.01 4.04.06.98.04 1.5.21 1.86.34.47.18.8.4 1.15.75.35.35.57.68.75 1.15.13.36.3.88.34 1.86.05 1.05.06 1.37.06 4.04s-.01 2.99-.06 4.04c-.04.98-.21 1.5-.34 1.86-.18.47-.4.8-.75 1.15-.35.35-.68.57-1.15.75-.36.13-.88.3-1.86.34-1.05.05-1.37.06-4.04.06s-2.99-.01-4.04-.06c-.98-.04-1.5-.21-1.86-.34a3.1 3.1 0 0 1-1.15-.75 3.1 3.1 0 0 1-.75-1.15c-.13-.36-.3-.88-.34-1.86C3.81 14.99 3.8 14.67 3.8 12s.01-2.99.06-4.04c.04-.98.21-1.5.34-1.86.18-.47.4-.8.75-1.15.35-.35.68-.57 1.15-.75.36-.13.88-.3 1.86-.34C9.01 3.81 9.33 3.8 12 3.8Zm0 3.05a5.15 5.15 0 1 0 0 10.3 5.15 5.15 0 0 0 0-10.3Zm0 8.5a3.35 3.35 0 1 1 0-6.7 3.35 3.35 0 0 1 0 6.7Zm5.36-8.7a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
