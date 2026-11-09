import { ImageResponse } from "next/og";

export const alt =
  "IgInbox — Automate Instagram DMs, comments, and story replies with visual flows";
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
          justifyContent: "space-between",
          padding: "72px 80px",
          color: "white",
          background:
            "radial-gradient(ellipse at 70% -10%, #4a1646 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, #1e1b4b 0%, transparent 45%), #09090c",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top — Logo + badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, #e879f9, #ec4899, #fb923c)",
                fontSize: "28px",
                fontWeight: 800,
              }}
            >
              I
            </div>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              IgInbox
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "100px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontSize: "16px",
              color: "#d4d4d8",
            }}
          >
            iginbox.com
          </div>
        </div>

        {/* Center — Headline + sub */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              maxWidth: "920px",
              fontSize: "62px",
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-2.5px",
            }}
          >
            Turn Instagram Comments into Customers on Autopilot
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#a1a1aa",
              lineHeight: 1.4,
              maxWidth: "700px",
            }}
          >
            Visual drag-and-drop flows for DM automation, comment replies, lead
            capture, and a shared team inbox.
          </div>
        </div>

        {/* Bottom — Feature pills */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["DM Automation", "Comment Replies", "Lead Capture", "Shared Inbox"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  borderRadius: "100px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#e4e4e7",
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #e879f9, #ec4899)",
                  }}
                />
                {label}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
