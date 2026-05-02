import { ImageResponse } from "next/og";

/**
 * Apple touch icon — 180x180 GSoCDex monogram on alabaster, no GSoC sun.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FBFBF9",
          color: "#1C1C19",
          fontFamily: "Georgia, 'IBM Plex Serif', serif",
          fontSize: 120,
          fontWeight: 500,
          letterSpacing: "-0.04em",
          borderRadius: 32,
          boxShadow: "inset 0 0 0 1px #E6DFD1",
        }}
      >
        G<span style={{ color: "#B45309", fontStyle: "italic", marginLeft: -2 }}>d</span>
      </div>
    ),
    size,
  );
}
