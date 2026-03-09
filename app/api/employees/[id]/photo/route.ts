import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ params es Promise en Next 15
) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const {id} = await params;
  const employeeId = id

  if (!token?.accessToken) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    };

  const backendBase = process.env.BACKEND_URL ?? "http://localhost:8000";
  const backendUrl = `${backendBase}/employees/${employeeId}/photo`;

  const res = await fetch(backendUrl, {
    headers: {
      Accept: "image/*",
      Authorization: `Bearer ${token.accessToken}`,
    },
    cache: "no-store",
  });

  if (!res.ok) return new NextResponse(null, { status: res.status });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const bytes = await res.arrayBuffer();

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}