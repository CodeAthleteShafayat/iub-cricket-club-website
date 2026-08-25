import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin (via jwks-rsa) does a CommonJS require() of jose, which is
  // pure ESM. Node's native require handles that interop fine, but
  // Turbopack's own module loader doesn't -- it fails at runtime on Vercel
  // with ERR_REQUIRE_ESM. Forcing these onto native require (skipping
  // Turbopack's bundling for them) fixes it.
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose", "google-auth-library"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
