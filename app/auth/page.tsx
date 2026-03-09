"use client";

import { useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function AuthPage() {
  const started = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const callbackUrl = searchParams.get("callbackUrl") ?? "/";
    void signIn("azure-ad", { callbackUrl });
  }, [searchParams]);

  return (
    <main className="h-dvh w-full grid place-items-center">
      <div className="text-sm text-zinc-600 dark:text-zinc-300">
        Redirigiendo a Azure para iniciar sesión…
      </div>
    </main>
  );
}