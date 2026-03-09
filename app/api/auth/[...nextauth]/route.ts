
import NextAuth, { type NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

async function refreshAzureAccessToken(token: any) {
  try {
    const tenantId = process.env.AZURE_AD_TENANT_ID!;
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      // IMPORTANTE: pide los mismos scopes que en el login
      scope: [
        "openid",
        "profile",
        "email",
        "offline_access",
        `api://${process.env.FASTAPI_CLIENT_ID}/user_impersonation`,
      ].join(" "),
    });

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const refreshed = await resp.json();
    if (!resp.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      // expires_in viene en segundos
      accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (e) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
      signIn: "/auth", // Página de login personalizada
    },
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          // Pedimos token para TU API (user_impersonation)
          scope: [
            "openid",
            "profile",
            "email",
            "offline_access",
            `api://${process.env.FASTAPI_CLIENT_ID}/user_impersonation`,
          ].join(" "),
        },
      },
    }),
  ],

  callbacks: {
    // 1) Guardamos access_token / refresh_token en JWT
    async jwt({ token, account }) {
      // Primer login
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // `expires_at` suele venir como epoch seconds en OAuth
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + 3600 * 1000;
        return token;
      }

      // Si aún no ha expirado, devolvemos tal cual
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 60_000) {
        return token;
      }

      // Si expiró, refrescamos
      return refreshAzureAccessToken(token);
    },


    // 2) NO expongas el access token al cliente si no lo necesitas.
    // Aquí solo devolvemos lo estándar.
    async session({ session }) {
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
