import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { PatientSearch } from "@/components/patients/patient-search";
import { PatientTableRows } from "@/components/patients/patient-table-rows";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("*")
    .order("full_name", { ascending: true });

  if (q?.trim()) {
    query = query.or(
      `full_name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`
    );
  }

  const { data: patients } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">
            {patients?.length ?? 0} paciente(s) cadastrado(s)
          </p>
        </div>
        <Link
          href="/pacientes/novo"
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Novo paciente
        </Link>
      </div>

      <PatientSearch defaultValue={q} />

      {!patients?.length ? (
        <Card className="py-12 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            {q ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? "Tente outro termo de busca"
              : "Comece cadastrando seu primeiro paciente"}
          </p>
          {!q && (
            <Link
              href="/pacientes/novo"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:underline"
            >
              <Plus className="h-4 w-4" />
              Cadastrar paciente
            </Link>
          )}
        </Card>
      ) : (
        <div className="data-table">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Nome</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Telefone</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">CPF</th>
                  <th className="px-4 py-3 font-semibold text-slate-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <PatientTableRows patients={patients} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
