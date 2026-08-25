import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return NextResponse.json(
        { user: null },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        }
      );
    }

    try {
      const users = await getUsersCollection();
      if (ObjectId.isValid(authUser.id)) {
        const dbUser = await users.findOne({ _id: new ObjectId(authUser.id) });
        if (dbUser) {
          return NextResponse.json(
            {
              user: {
                id: dbUser._id!.toString(),
                email: dbUser.email,
                name: dbUser.name ?? authUser.name ?? dbUser.email.split("@")[0],
                avatarUrl: dbUser.avatarUrl ?? authUser.avatarUrl ?? null
              }
            },
            {
              headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
              }
            }
          );
        }
      }
    } catch (dbErr) {
      console.error("Erro ao buscar dados do usuário no banco:", dbErr);
    }

    return NextResponse.json(
      { user: authUser },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
        }
      }
    );
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
