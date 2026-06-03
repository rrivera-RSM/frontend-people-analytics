"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

type MeResponse = Record<string, any> | null;

type CallStatus = "idle" | "loading" | "success" | "error";

export function AzureProfile() {
  const { data: session, status: authStatus } = useSession();
  const isAuthed = authStatus === "authenticated";

  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [me, setMe] = useState<MeResponse>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [photoOk, setPhotoOk] = useState(true);

  const displayName = useMemo(() => {
    const name = session?.user?.name?.trim();
    if (name) return name;
    // Fallback a email si existe
    const email = session?.user?.email?.trim();
    if (email) return email;
    return "Usuario";
  }, [session]);

  const initials = useMemo(() => {
    const parts = displayName.split(/\s+/).filter(Boolean);
    const i = (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
    return i.toUpperCase();
  }, [displayName]);

  async function fetchMe() {
    setCallStatus("loading");
    setError(null);
    // No borramos me inmediatamente para evitar “parpadeo”, pero si lo prefieres:
    // setMe(null);

    try {
      const res = await fetch("/api/me", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const body = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const message =
          typeof body === "string" ? body : JSON.stringify(body, null, 2);
        throw new Error(`${res.status} ${res.statusText}\n${message}`);
      }

      setMe(body);
      setCallStatus("success");
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setCallStatus("error");
    }
  }

  // Auto-cargar /api/me al autenticar (igual que tenías)
  useEffect(() => {
    if (!isAuthed) {
      setCallStatus("idle");
      setMe(null);
      setError(null);
      setPhotoOk(true);
      return;
    }

    // Al autenticar, refrescamos perfil automáticamente
    void fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed]);

  return (
    <div className="w-full max-w-3xl">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          Azure Profile
        </h2>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Este panel usa{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            /api/me
          </code>{" "}
          y{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
            /api/me/photo
          </code>{" "}
          para mostrar tu perfil desde FastAPI (con OBO si hay foto).
        </p>

        {/* Estado de Auth */}
        {!isAuthed ? (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {authStatus === "loading"
                ? "Cargando sesión…"
                : "No estás autenticado."}
            </div>

            <button
              onClick={() => signIn("azure-ad")}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--rsm-blue)] px-4 py-2 text-white hover:bg-[#0086c0] disabled:opacity-50"
              disabled={authStatus === "loading"}
            >
              {authStatus === "loading" ? <SpinnerIcon /> : <UserIcon />}
              Iniciar sesión con Azure
            </button>
          </div>
        ) : (
          <>
            {/* Header del usuario (avatar + nombre) */}
            <div className="flex w-full items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {photoOk ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/api/me/photo"
                      alt="Azure profile"
                      className="h-full w-full object-cover"
                      onError={() => setPhotoOk(false)}
                    />
                  ) : (
                    <span aria-hidden="true">{initials}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-zinc-800 dark:text-zinc-100">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {session.user?.email ?? "—"}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={fetchMe}
                  disabled={callStatus === "loading"}
                  className="inline-flex items-center gap-2 rounded-md bg-[var(--rsm-blue)] px-4 py-2 text-white hover:bg-[#0086c0] disabled:opacity-50"
                >
                  {callStatus === "loading" ? <SpinnerIcon /> : <RefreshIcon />}
                  {callStatus === "loading" ? "Refrescando..." : "Refrescar"}
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  disabled={callStatus === "loading" || (callStatus === "idle" && !me && !error)}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <ExpandIcon />
                  Ver en modal
                </button>

                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  <LogoutIcon />
                  Cerrar sesión
                </button>
              </div>
            </div>

            {/* Resultado inline */}
            <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">
                Resultado inline (/api/me)
              </p>

              {callStatus === "idle" && (
                <p className="text-sm text-zinc-500">Sin llamadas aún.</p>
              )}

              {callStatus === "loading" && (
                <p className="text-sm text-zinc-600">Cargando…</p>
              )}

              {callStatus === "error" && (
                <pre className="whitespace-pre-wrap break-words text-sm text-[var(--rsm-red)]">
                  {error}
                </pre>
              )}

              {callStatus === "success" && (
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {JSON.stringify(me, null, 2)}
                </pre>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Respuesta de /api/me
              </h3>
              <button
                className="rounded p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setShowModal(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Contenido */}
            {!isAuthed ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                No autenticado.
              </div>
            ) : callStatus === "error" ? (
              <div className="whitespace-pre-wrap break-words text-sm text-[var(--rsm-red)]">
                {error}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words text-sm">
                {me ? JSON.stringify(me, null, 2) : "Sin datos aún."}
              </pre>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Icons (mismo estilo que tu debugger) ===== */

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11a4 4 0 100-8 4 4 0 000 8z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11a8 8 0 10-3.3 6.5"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 11v-6h-6"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 3h6v6"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 14L21 3"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21H3v-6"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21l11-11"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 17l5-5-5-5"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12H9"
      />
    </svg>
  );
}
