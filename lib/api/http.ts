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

export async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const res = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
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
