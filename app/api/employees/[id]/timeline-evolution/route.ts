import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { id } = await params;

  if (!token?.accessToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendBase = process.env.BACKEND_URL ?? "http://localhost:8000";
  const backendUrl = `${backendBase}/employees/${id}/timeline-evolution`;

  const res = await fetch(backendUrl, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return new NextResponse(null, { status: res.status });

  const data = await res.json();

  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
