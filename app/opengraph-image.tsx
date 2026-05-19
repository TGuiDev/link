import { ImageResponse } from "next/og";

export const alt = "Link - encurtador de links";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://link.guidev.site";

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#05110d",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: 56,
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#ffffff",
            borderRadius: 48,
            display: "flex",
            height: 360,
            justifyContent: "center",
            width: 360
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Link"
            src={`${baseUrl}/Dark_Theme_Logo.svg`}
            style={{
              height: 250,
              objectFit: "contain",
              width: 250
            }}
          />
        </div>

        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            gap: 26,
            justifyContent: "center",
            width: 650
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={alt}
            src={`${baseUrl}/meta_banner/link.png`}
            style={{
              height: "auto",
              maxHeight: 220,
              objectFit: "contain",
              width: 650
            }}
          />
          <div
            style={{
              color: "#d1fae5",
              fontSize: 34,
              fontWeight: 800,
              lineHeight: 1.25
            }}
          >
            Links curtos, metricas e API em um unico lugar.
          </div>
        </div>
      </div>
    ),
    size
  );
}
