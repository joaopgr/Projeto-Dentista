import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { cookies } from "next/headers";
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionPatientId,
} from "@/lib/client-session";
import { ClientSignOutButton } from "@/components/portal/client-sign-out-button";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  const patientId = token ? await verifyClientSessionPatientId(token) : null;

  if (!patientId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900">OdontoClinic</p>
              <p className="text-xs text-slate-500">Área do paciente</p>
            </div>
          </div>
          <ClientSignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
