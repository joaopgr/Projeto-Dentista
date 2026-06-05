import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CLIENT_SESSION_COOKIE,
  clientSessionCookieOptions,
  createClientSessionToken,
} from "@/lib/client-session";
import { authenticateClientByCpf } from "@/lib/portal/data";

export async function POST(request: Request) {
  const body = await request.json();
  const cpf = String(body.cpf || "");
  const password = String(body.password || "");

  const result = await authenticateClientByCpf(cpf, password);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const token = await createClientSessionToken(result.patientId);
  const cookieStore = await cookies();
  cookieStore.set(CLIENT_SESSION_COOKIE, token, clientSessionCookieOptions());

  return NextResponse.json({ ok: true });
}
