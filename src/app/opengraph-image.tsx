import { ImageResponse } from "next/og";

export const alt =
  "IgInbox — Instagram DM & Comment Automation Platform";
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
          alignItems: "center",
          justifyContent: "center",
          gap: "28px",
          color: "white",
          background:
            "radial-gradient(ellipse at 70% -10%, #4a1646 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, #1e1b4b 0%, transparent 45%), #09090c",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #e879f9, #ec4899, #fb923c)",
            fontSize: "40px",
            fontWeight: 800,
          }}
        >
          I
        </div>
        <div
          style={{
            fontSize: "52px",
            fontWeight: 800,
            letterSpacing: "-2px",
          }}
        >
          IgInbox
        </div>
        <div
          style={{
            fontSize: "22px",
            color: "#a1a1aa",
            maxWidth: "600px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Instagram DM & Comment Automation Platform
        </div>
      </div>
    ),
    { ...size },
  );
}
