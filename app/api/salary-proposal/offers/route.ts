import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

async function readBackendBody(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? await res.json()
    : await res.text();
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.accessToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const employeeId = Number(url.searchParams.get("employee_id"));

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return NextResponse.json(
      { message: "employee_id query param is required" },
      { status: 400 },
    );
  }

  const backendBase = process.env.BACKEND_URL ?? "http://localhost:8000";
  const backendUrl = `${backendBase}/salary-offers/employees/${employeeId}/latest`;

  const res = await fetch(backendUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token.accessToken}`,
    },
    cache: "no-store",
  });

  const body = await readBackendBody(res);
  return NextResponse.json(body, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token?.accessToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backendBase = process.env.BACKEND_URL ?? "http://localhost:8000";
  const backendUrl = `${backendBase}/salary-offers`;
  const payload = await req.json();

  const res = await fetch(backendUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.accessToken}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await readBackendBody(res);

  return NextResponse.json(body, { status: res.status });
}
