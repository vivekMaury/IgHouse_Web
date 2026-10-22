import { ImageResponse } from "next/og";

export const alt = "IgHouse turns Instagram comments into customers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "76px",
          color: "white",
          background: "radial-gradient(ellipse at 80% 0%, #4a1646 0%, transparent 48%), #09090c",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "44px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #e879f9, #ec4899, #fb923c)",
              fontSize: "27px",
              fontWeight: 700,
            }}
          >
            I
          </div>
          <span style={{ fontSize: "26px", fontWeight: 650, letterSpacing: "-1px" }}>IgHouse</span>
        </div>
        <div style={{ maxWidth: "930px", fontSize: "64px", lineHeight: 1.08, fontWeight: 700, letterSpacing: "-3px" }}>
          Turn Instagram comments into customers on autopilot
        </div>
        <div style={{ marginTop: "27px", fontSize: "22px", color: "#a1a1aa" }}>
          Comment-to-DM automation, visual flows, and a shared inbox.
        </div>
      </div>
    ),
    { ...size },
  );
}
