"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";

export function PatientSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue || "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/pacientes?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome, telefone ou e-mail..."
        className="w-full rounded-full border border-slate-200/70 bg-white/80 py-2.5 pl-10 pr-4 text-sm shadow-sm transition focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
      />
    </form>
  );
}
