import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CLUB_NAME, SOCIAL_LINKS } from "@/lib/constants";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Official website of the IUB Cricket Club at Independent University, Bangladesh. Club news, tournament fixtures and results, photo gallery, and membership signup.";

export const metadata: Metadata = {
  // Makes every relative URL in metadata (OG images, canonicals) resolve to
  // the real domain. Without it Next emits relative OG URLs, which Facebook
  // and WhatsApp cannot fetch, so shared links show no preview.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${CLUB_NAME} — Independent University, Bangladesh`,
    // Child pages set a short title (e.g. "News") and get the club name
    // appended automatically, so no page repeats it by hand.
    template: `%s | ${CLUB_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: CLUB_NAME,
  keywords: [
    "IUB Cricket Club",
    "Independent University Bangladesh cricket",
    "IUB cricket",
    "university cricket Bangladesh",
    "IUB sports club",
    "Dhaka university cricket club",
  ],
  authors: [{ name: CLUB_NAME }],
  openGraph: {
    type: "website",
    siteName: CLUB_NAME,
    locale: "en_US",
    url: SITE_URL,
    title: `${CLUB_NAME} — Independent University, Bangladesh`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${CLUB_NAME} — Independent University, Bangladesh`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// Site-wide structured data. Gives Google an explicit machine-readable
// identity for the club (rather than inferring one from page text), which is
// what powers a knowledge-panel-style result for a branded search.
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: CLUB_NAME,
  sport: "Cricket",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: SITE_DESCRIPTION,
  sameAs: [SOCIAL_LINKS.facebook, SOCIAL_LINKS.instagram],
  parentOrganization: {
    "@type": "CollegeOrUniversity",
    name: "Independent University, Bangladesh",
    url: "https://iub.edu.bd",
  },
  location: {
    "@type": "Place",
    name: "Independent University, Bangladesh",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Plot 16, Block B, Aftabuddin Ahmed Road, Bashundhara R/A",
      addressLocality: "Dhaka",
      postalCode: "1229",
      addressCountry: "BD",
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
    >
      <head>
        {/* Every image on the site (hero carousel, profile photos, gallery)
            comes from Cloudinary. Opening the DNS/TLS connection during HTML
            parse means the hero photo isn't also paying for the handshake
            once its URL finally arrives from Firestore. */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSON_LD),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <div className="grain-overlay" />
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        {/* Vercel Web Analytics. Cookieless and does not collect personal
            data, so it needs no consent banner. The script only loads on a
            Vercel deployment, so local dev and any other host are unaffected. */}
        <Analytics />
      </body>
    </html>
  );
}
