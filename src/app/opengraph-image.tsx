import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Banner do Link";
export const size = {
  width: 1500,
  height: 500
};
export const contentType = "image/png";

export default async function OpenGraphImage() {
  try {
    const filePath = join(process.cwd(), "public", "meta-banner", "link.png");
    const imageBuffer = await readFile(filePath);
    const base64Image = `data:image/png;base64,${imageBuffer.toString("base64")}`;

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
            src={base64Image}
            width={1500}
            height={500}
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
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            alignItems: "center",
            background: "#09090b",
            color: "#ffffff",
            display: "flex",
            fontSize: 48,
            fontWeight: 900,
            height: "100%",
            justifyContent: "center",
            width: "100%"
          }}
        >
          Link
        </div>
      ),
      size
    );
  }
}
