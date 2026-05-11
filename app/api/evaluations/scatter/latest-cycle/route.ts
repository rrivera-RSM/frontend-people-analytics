import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.accessToken) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
  
  const backendBase = process.env.BACKEND_URL ?? "http://localhost:8000";
  const backendUrl = `${backendBase}/evaluations/scatter/latest-cycle`;

  const res = await fetch(backendUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  return NextResponse.json(body, { status: res.status });
}
``