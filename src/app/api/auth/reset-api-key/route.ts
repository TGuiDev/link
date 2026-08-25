import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getAuthenticatedUser } from "@/lib/auth";
import { createApiKeyForUser } from "@/lib/api-keys";
import { getUsersCollection, ensureMongoIndexes } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  try {
    await ensureMongoIndexes();
    const users = await getUsersCollection();
    const query = ObjectId.isValid(user.id) ? { _id: new ObjectId(user.id) } : { _id: user.id as unknown as ObjectId };

    const result = await users.findOneAndUpdate(
      query,
      { $inc: { apiKeyVersion: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    const nextVersion = result?.apiKeyVersion ?? 2;
    const newApiKey = createApiKeyForUser(user.id, nextVersion);

    return NextResponse.json({
      apiKey: newApiKey,
      message: "Chave de API resetada com sucesso. As chaves antigas foram revogadas."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao resetar chave de API.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
