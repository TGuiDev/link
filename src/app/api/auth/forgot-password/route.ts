import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getUsersCollection } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Informe um email válido." }, { status: 400 });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ email });

    if (user) {
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            resetToken,
            resetTokenExpires,
            updatedAt: new Date()
          }
        }
      );
    }

    // Por segurança, sempre retornamos sucesso para não expor se o email existe ou não
    return NextResponse.json({
      message: "Se o email estiver cadastrado, as instruções para redefinição de senha foram processadas."
    });
  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    return NextResponse.json({ error: "Não foi possível processar a solicitação." }, { status: 500 });
  }
}
