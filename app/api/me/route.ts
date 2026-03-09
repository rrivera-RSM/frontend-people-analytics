
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const backend = process.env.FASTAPI_URL!;
  const resp = await fetch(`${backend}/me`, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
    cache: "no-store",
  });

  if (!resp.ok) {
    return Response.json(
      { message: "Backend error", status: resp.status, body: await resp.text() },
      { status: resp.status }
    );
  }

  const data = await resp.json();
  return Response.json(data);
}
