import { ImageResponse } from "next/og";

export const alt = "Banner do Link";
export const size = {
  width: 1500,
  height: 500
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
          justifyContent: "center",
          width: "100%"
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={alt}
          src={`${baseUrl}/meta-banner/link.png`}
          style={{
            height: 500,
            objectFit: "contain",
            width: 1500
          }}
        />
      </div>
    ),
    size
  );
}
