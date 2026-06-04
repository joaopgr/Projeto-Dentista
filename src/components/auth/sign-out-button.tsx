"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="mt-2 flex items-center gap-2 text-sm text-slate-500 hover:text-red-600"
    >
      <LogOut className="h-4 w-4" />
      {!compact && "Sair"}
    </button>
  );
}
