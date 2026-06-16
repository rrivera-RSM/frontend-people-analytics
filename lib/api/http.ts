import { getSession } from "next-auth/react";

async function buildErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; detail?: string };
    return body.message ?? body.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchWithSessionRefresh(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const fetchInit: RequestInit = {
    ...init,
    credentials: init.credentials ?? "same-origin",
  };

  const res = await fetch(url, fetchInit);

  if (res.status !== 401 || typeof window === "undefined") {
    return res;
  }

  await getSession();
  return fetch(url, fetchInit);
}

export async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const res = await fetchWithSessionRefresh(url, {
    method: "GET",
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(
      await buildErrorMessage(
        res,
        `No se pudo recuperar ${url} (${res.status})`,
      ),
    );
  }

  return res.json() as Promise<T>;
}
