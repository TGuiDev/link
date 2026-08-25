import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsersCollection, ensureMongoIndexes } from "@/lib/mongodb";
import { signSessionToken, getSessionCookieOptions } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await ensureMongoIndexes();
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name).trim() : email.split("@")[0];

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Informe um email válido." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const users = await getUsersCollection();
    const existing = await users.findOne({ email });

    if (existing) {
      return NextResponse.json({ error: "Este email já está cadastrado." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const insertResult = await users.insertOne({
      email,
      name,
      passwordHash,
      avatarUrl: null,
      accounts: [],
      createdAt: now,
      updatedAt: now
    });

    const userId = insertResult.insertedId.toString();
    const sessionToken = await signSessionToken({
      userId,
      email,
      name,
      avatarUrl: null
    });

    const response = NextResponse.json(
      {
        user: {
          id: userId,
          email,
          name,
          avatarUrl: null
        }
      },
      { status: 201 }
    );

    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(cookieOptions.name, sessionToken, cookieOptions);

    return response;
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json({ error: "Não foi possível criar a conta. Tente novamente." }, { status: 500 });
  }
}
