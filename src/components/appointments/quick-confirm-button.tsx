"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickConfirmButton({
  appointmentId,
  className,
  label = "Confirmar",
}: {
  appointmentId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading || done) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: "POST",
      });
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
        <Check className="h-3.5 w-3.5" />
        Confirmado
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={loading}
      className={cn(
        "btn-soft shrink-0 px-3 py-1.5 text-xs disabled:opacity-60",
        className
      )}
    >
      <Check className="h-3.5 w-3.5" />
      {loading ? "..." : label}
    </button>
  );
}
