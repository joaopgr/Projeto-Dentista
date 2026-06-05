import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionPatientId,
} from "@/lib/client-session";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  const patientId = token ? await verifyClientSessionPatientId(token) : null;

  if (patientId) {
    redirect("/portal");
  }

  redirect("/login");
}
