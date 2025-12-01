import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontFamily: "Inter, 'Segoe UI', sans-serif",
          background: "radial-gradient(circle at 20% 20%, #1f2b3d, #050b13)",
          color: "#f8fafc",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#92a7ff",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: "#92a7ff",
              borderRadius: 999,
            }}
          />
          ABS.ai
        </div>

        <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 72,
                lineHeight: 1.1,
                fontWeight: 700,
                margin: 0,
              }}
            >
              AI Body Enhancer for realistic transformations
            </p>
            <p
              style={{
                marginTop: 25,
                fontSize: 32,
                color: "#cdd5f6",
                maxWidth: 540,
              }}
            >
              Upload a photo, paint over the area, and let our models craft
              natural-looking abs in seconds.
            </p>
            <div
              style={{
                marginTop: 40,
                display: "inline-flex",
                padding: "16px 36px",
                borderRadius: 999,
                fontSize: 26,
                fontWeight: 600,
                background:
                  "linear-gradient(135deg, #7af8d3 0%, #39c7ff 90%)",
                color: "#042026",
                boxShadow: "0 18px 45px rgba(58, 197, 255, 0.35)",
              }}
            >
              absai.app · Try it now
            </div>
          </div>

          <div
            style={{
              width: 360,
              borderRadius: 32,
              background: "rgba(255,255,255,0.07)",
              padding: 32,
              backdropFilter: "blur(10px)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                marginBottom: 18,
                color: "#ffffff",
              }}
            >
              Preview
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: 16,
              }}
            >
              {[
                { label: "Natural Fit", desc: "Subtle tone" },
                { label: "Athletic", desc: "Moderate muscle" },
                { label: "Defined", desc: "Clear six-pack" },
                { label: "Weight Loss", desc: "-5 kg look" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "14px 16px",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 22 }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: "#c6d0f0",
                      marginTop: 6,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 24,
            letterSpacing: 6,
            color: "#94a9ff",
          }}
        >
          Made with Next.js · Stripe · DynamoDB
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

