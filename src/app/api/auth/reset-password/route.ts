import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getUsersCollection } from "@/lib/mongodb";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");
    const token = body.token ? String(body.token).trim() : null;

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const users = await getUsersCollection();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    // Cenário 1: Usuário autenticado alterando a própria senha
    const authUser = await getAuthenticatedUser(request);
    if (authUser) {
      const query = ObjectId.isValid(authUser.id)
        ? { _id: new ObjectId(authUser.id) }
        : { _id: authUser.id as unknown as ObjectId };

      await users.updateOne(query, {
        $set: {
          passwordHash,
          resetToken: null,
          resetTokenExpires: null,
          updatedAt: now
        }
      });

      return NextResponse.json({ message: "Senha atualizada com sucesso." });
    }

    // Cenário 2: Redefinição via token de email
    if (token) {
      const user = await users.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: now }
      });

      if (!user) {
        return NextResponse.json({ error: "Token de recuperação inválido ou expirado." }, { status: 400 });
      }

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordHash,
            resetToken: null,
            resetTokenExpires: null,
            updatedAt: now
          }
        }
      );

      return NextResponse.json({ message: "Senha redefinida com sucesso." });
    }

    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  } catch (error) {
    console.error("Erro na troca de senha:", error);
    return NextResponse.json({ error: "Não foi possível atualizar a senha." }, { status: 500 });
  }
}
