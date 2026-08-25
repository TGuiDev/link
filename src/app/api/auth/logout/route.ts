import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/jwt";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieOptions = getSessionCookieOptions();

  response.cookies.set(cookieOptions.name, "", {
    ...cookieOptions,
    maxAge: 0
  });

  return response;
}
