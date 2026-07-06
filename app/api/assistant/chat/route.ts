import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

type AssistantChatRequest = {
  employee_id?: number;
  message?: string;
  conversation?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body: AssistantChatRequest = await req.json();

    if (body.employee_id === undefined || body.employee_id === null) {
      return NextResponse.json(
        { detail: "employee_id es obligatorio" },
        { status: 400 },
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { detail: "message es obligatorio" },
        { status: 400 },
      );
    }

    const backendBaseUrl =
      process.env.BACKEND_URL ??
      process.env.FASTAPI_URL ??
      process.env.API_BASE_URL ??
      "http://localhost:8000";
    const headers = new Headers({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.accessToken}`,
    });

    const response = await fetch(`${backendBaseUrl}/assistant/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        employee_id: body.employee_id,
        message: body.message,
        conversation: body.conversation ?? [],
      }),
      cache: "no-store",
    });

    const data = (await response.json()) as unknown;

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error en /api/assistant/chat:", error);

    return NextResponse.json(
      { detail: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
