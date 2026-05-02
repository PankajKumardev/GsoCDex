import { ImageResponse } from "next/og";

/**
 * App icon — GSoCDex monogram only.
 *
 * Per the original brief §12.3, the favicon is the GSoCDex monogram, NOT the
 * GSoC sun. The sun is reserved for the header logo + watermark. Keeping
 * those slots distinct is part of how we stay inside the trademark guardrails.
 *
 * Renders a deep-charcoal alabaster square with a serif "G" + italic gold "d".
 */

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1C1C19",
          color: "#FBFBF9",
          fontFamily: "Georgia, 'IBM Plex Serif', serif",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-0.04em",
          borderRadius: 6,
        }}
      >
        G<span style={{ color: "#B45309", fontStyle: "italic", marginLeft: -1 }}>d</span>
      </div>
    ),
    size,
  );
}
