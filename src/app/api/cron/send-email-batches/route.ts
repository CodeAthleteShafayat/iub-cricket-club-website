import { NextResponse } from "next/server";
import { processAllPendingCampaigns } from "@/lib/server/campaigns";

export const maxDuration = 60;

// Triggered once a day by Vercel Cron (see vercel.json). Vercel automatically
// attaches "Authorization: Bearer $CRON_SECRET" when it invokes this route --
// set CRON_SECRET to any random string in the project's env vars so this
// can't be triggered by anyone else.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  if (!secret || header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await processAllPendingCampaigns();
  return NextResponse.json({ results });
}
