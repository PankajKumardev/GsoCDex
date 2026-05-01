import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

import { OG_HEIGHT, OG_WIDTH, SITE_URL } from "@/lib/constants";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") ?? "GSoCDex").slice(0, 140);
  const subtitle = (searchParams.get("subtitle") ?? "Every accepted GSoC proposal, browsable.").slice(0, 140);
  const kind = searchParams.get("kind") ?? "home";

  const accent = "#2563EB";
  const ink = "#202124";
  const muted = "#5F6368";
  const surface = "#F8F9FA";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#FFFFFF",
          fontFamily: '"Inter", "system-ui", sans-serif',
          color: ink,
        }}
      >
        {/* Top header strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "48px 64px 0",
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            GSoCDex
          </span>
          <span
            style={{
              fontSize: 16,
              fontFamily: "monospace",
              color: muted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {kind}
          </span>
        </div>

        {/* Centered content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            padding: "0 64px",
          }}
        >
          <span
            style={{
              fontSize: 18,
              fontFamily: "monospace",
              color: muted,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              marginBottom: 16,
            }}
          >
            {subtitle}
          </span>
          <h1
            style={{
              display: "flex",
              fontSize: title.length > 70 ? 56 : 72,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              margin: 0,
              maxWidth: 1000,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 64px 40px",
            borderTop: `4px solid ${accent}`,
            paddingTop: 32,
            marginTop: 32,
            background: surface,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 18, color: muted }}>
            {SITE_URL.replace(/^https?:\/\//, "")}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 14, color: muted }}>
            Every accepted GSoC proposal, browsable.
          </span>
        </div>
      </div>
    ),
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    },
  );
}
