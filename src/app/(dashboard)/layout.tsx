import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BrandLogo } from "@/components/brand/brand-logo";
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
      <aside className="fixed inset-y-3 left-3 z-30 hidden w-[15.5rem] flex-col overflow-hidden rounded-[2rem] bg-gradient-to-b from-teal-950 via-teal-900 to-slate-950 shadow-2xl shadow-teal-950/30 lg:flex">
        <div className="border-b border-white/10 px-5 py-6">
          <BrandLogo variant="sidebar" />
        </div>

        <SidebarNav />

        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="truncate text-sm font-medium text-white">
              {profile?.full_name || user.email}
            </p>
            <p className="truncate text-xs text-teal-200/70">{user.email}</p>
            <div className="mt-3">
              <SignOutButton light />
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[17rem]">
        <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/70 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <BrandLogo variant="header" />
            <SignOutButton compact />
          </div>
          <MobileNav />
        </header>

        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
