import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  return apiNotFound(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return apiNotFound(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return apiNotFound(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return apiNotFound(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return apiNotFound(request, context);
}

async function apiNotFound(request: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const requestedPath = `/api/${path.join("/")}`;

  return NextResponse.json(
    {
      error: "Endpoint não encontrado.",
      path: requestedPath,
      method: request.method,
      availableEndpoints: [
        {
          method: "POST",
          path: "/api/links",
          description: "Cria um link curto randômico ou customizado."
        },
        {
          method: "GET",
          path: "/api/links/{slug}",
          description: "Consulta um link existente pelo slug."
        },
        {
          method: "GET",
          path: "/api/dashboard",
          description: "Lista métricas e links do usuário autenticado."
        },
        {
          method: "GET",
          path: "/api/stats",
          description: "Consulta o total público de links criados."
        }
      ]
    },
    { status: 404 }
  );
}
