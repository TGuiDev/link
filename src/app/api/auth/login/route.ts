import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsersCollection } from "@/lib/mongodb";
import { signSessionToken, getSessionCookieOptions } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
    }

    const userId = user._id!.toString();
    const sessionToken = await signSessionToken({
      userId,
      email: user.email,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null
    });

    const response = NextResponse.json({
      user: {
        id: userId,
        email: user.email,
        name: user.name ?? null,
        avatarUrl: user.avatarUrl ?? null
      },
      token: sessionToken
    });

    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Não foi possível realizar o login." }, { status: 500 });
  }
}
