
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const backend = process.env.FASTAPI_URL!;
  const url = new URL(`${backend}/me`);
  url.searchParams.set("include_photo", "true");
  url.searchParams.set("size", "96x96");

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token.accessToken}` },
    cache: "no-store",
  });

  if (resp.status === 404) return new Response(null, { status: 404 });
  if (!resp.ok) return new Response(await resp.text(), { status: resp.status });

  const me = await resp.json();

  // Tu FastAPI devuelve { photo: { contentType, base64 } } o photo: null
  if (!me.photo?.base64) {
    return new Response(null, { status: 404 });
  }

  const buffer = Buffer.from(me.photo.base64, "base64");
  const contentType = me.photo.contentType || "image/jpeg";

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      // Evita cache público de fotos de usuario (ajusta a tu gusto)
      "Cache-Control": "private, max-age=300",
    },
  });
}
