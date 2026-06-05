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
      className="btn-ghost px-3 py-2"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </button>
  );
}
