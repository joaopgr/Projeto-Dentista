"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({
  compact,
  light,
}: {
  compact?: boolean;
  light?: boolean;
}) {
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
      className={cn(
        "mt-2 flex items-center gap-2 text-sm transition",
        light
          ? "text-teal-200/80 hover:text-white"
          : "text-slate-500 hover:text-red-600"
      )}
    >
      <LogOut className="h-4 w-4" />
      {!compact && "Sair"}
    </button>
  );
}
