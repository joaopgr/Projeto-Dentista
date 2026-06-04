import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { MobileNav, SidebarNav } from "@/components/layout/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, clinic_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="app-shell min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-teal-900/10 bg-gradient-to-b from-teal-900 via-teal-800 to-teal-900 lg:flex">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-white">OdontoClinic</p>
              <p className="truncate text-xs text-teal-200/80">
                {profile?.clinic_name || "Consultório"}
              </p>
            </div>
          </div>
        </div>

        <SidebarNav />

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
            <p className="truncate text-sm font-medium text-white">
              {profile?.full_name || user.email}
            </p>
            <p className="truncate text-xs text-teal-200/70">{user.email}</p>
            <SignOutButton light />
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900">OdontoClinic</span>
            </div>
            <SignOutButton compact />
          </div>
          <MobileNav />
        </header>

        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
