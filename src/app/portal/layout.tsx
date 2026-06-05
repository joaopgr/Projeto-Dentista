import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionPatientId,
} from "@/lib/client-session";
import { BrandLogo } from "@/components/brand/brand-logo";
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50/80 via-slate-50 to-slate-100">
      <header className="border-b border-teal-100/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <BrandLogo variant="portal" />
          <ClientSignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
