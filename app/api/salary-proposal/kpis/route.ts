import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.accessToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendBase = process.env.BACKEND_URL ?? "http://localhost:8000";
  const url = new URL(req.url);
  const params = new URLSearchParams();

  ["society_id", "department_id", "office_id", "category_id"].forEach((key) => {
    const value = url.searchParams.get(key);
    if (value) {
      params.set(key, value);
    }
  });

  const backendUrl = `${backendBase}/kpis${
    params.size > 0 ? `?${params.toString()}` : ""
  }`;

  const res = await fetch(backendUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.accessToken}`,
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  return NextResponse.json(body, {
    status: res.status,
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}
