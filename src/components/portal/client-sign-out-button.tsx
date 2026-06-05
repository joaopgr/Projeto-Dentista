"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function ClientSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/client/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  );
}
