import { NextResponse } from "next/server";

// Temporary diagnostic route -- reports the actual Node.js version this
// deployment is executing on, to settle an ERR_REQUIRE_ESM investigation
// without guessing. Delete once resolved.
export async function GET() {
  return NextResponse.json({
    nodeVersion: process.version,
    engines: process.versions,
  });
}
