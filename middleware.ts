// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /**
     * Protege TODO excepto:
     * - /api/auth (rutas internas de NextAuth)
     * - /auth (nuestra página de auto-login)
     * - /_next (assets)
     * - /favicon.ico
     */
    "/((?!api/auth|auth|_next|favicon.ico).*)",
  ],
};