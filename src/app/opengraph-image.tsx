import { ImageResponse } from "next/og";
import { CLUB_NAME } from "@/lib/constants";

// Generated once at build time into a static 1200x630 PNG, which is the size
// Facebook/WhatsApp/Twitter expect for a large link preview. Drawn in code
// rather than shipped as an asset so it always matches the club's palette and
// never goes stale against a rebrand.
export const alt = `${CLUB_NAME} — Independent University, Bangladesh`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #060f1f 0%, #0b1e3d 55%, #1c3563 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            color: "#e6c369",
            textTransform: "uppercase",
            marginBottom: 28,
          }}
        >
          Independent University, Bangladesh
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          {CLUB_NAME}
        </div>
        {/* Cricket-ball seam motif, matching the site's recurring divider. */}
        <div
          style={{
            display: "flex",
            width: 320,
            height: 6,
            marginTop: 36,
            background: "#c99a2e",
            borderRadius: 3,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(255,255,255,0.72)",
            marginTop: 36,
          }}
        >
          News · Tournaments · Gallery · Membership
        </div>
      </div>
    ),
    size
  );
}
