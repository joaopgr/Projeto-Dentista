export const CLIENT_SESSION_COOKIE = "odontoclinic_client";
const SESSION_DAYS = 7;

export type ClientSession = {
  patientId: string;
  cpf: string;
};

function getSecret(): string {
  return (
    process.env.CLIENT_SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "odontoclinic-dev-secret"
  );
}

async function hmacSign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createClientSessionToken(
  patientId: string,
  cpf: string
): Promise<string> {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${patientId}.${cpf}.${exp}`;
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifyClientSessionToken(
  token: string
): Promise<ClientSession | null> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;

  const sig = token.slice(lastDot + 1);
  const payload = token.slice(0, lastDot);
  const parts = payload.split(".");

  if (parts.length !== 3) return null;

  const [patientId, cpf, expStr] = parts;
  const exp = parseInt(expStr, 10);
  if (!patientId || !cpf || cpf.length !== 11 || Number.isNaN(exp) || Date.now() > exp) {
    return null;
  }

  const expected = await hmacSign(`${patientId}.${cpf}.${expStr}`);
  if (sig.length !== expected.length) return null;

  let match = true;
  for (let i = 0; i < sig.length; i++) {
    if (sig[i] !== expected[i]) match = false;
  }
  if (!match) return null;

  return { patientId, cpf };
}

/** Compatível com middleware que só precisa do id */
export async function verifyClientSessionPatientId(
  token: string
): Promise<string | null> {
  const session = await verifyClientSessionToken(token);
  return session?.patientId ?? null;
}

export function clientSessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 86400) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
