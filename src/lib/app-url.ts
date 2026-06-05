/** URL pública do app em produção (Vercel) */
export const PRODUCTION_APP_URL =
  "https://projeto-dentista-beige.vercel.app";

/**
 * URL base para links enviados a pacientes (WhatsApp, confirmação).
 * Nunca usa localhost — sempre produção se a variável não estiver definida.
 */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window === "undefined" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return PRODUCTION_APP_URL;
}
