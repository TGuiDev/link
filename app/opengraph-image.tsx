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
          justifyContent: "center",
          padding: 40,
          width: "100%"
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={alt}
          src={`${baseUrl}/meta_banner/link.png`}
          style={{
            height: "auto",
            maxHeight: 550,
            maxWidth: 1120,
            objectFit: "contain",
            width: "100%"
          }}
        />
      </div>
    ),
    size
  );
}
