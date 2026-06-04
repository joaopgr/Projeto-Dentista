"use client";

import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-bold text-slate-900">Algo deu errado</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Ocorreu um erro ao carregar esta página. Tente novamente ou volte ao
        início.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ir ao início
        </Link>
      </div>
    </div>
  );
}
