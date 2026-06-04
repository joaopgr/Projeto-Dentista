import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Calendar, ChevronRight, Clock, Package, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { normalizeRelation } from "@/lib/utils";
import { APPOINTMENT_STATUS_LABELS, isLowStock } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  const [
    { count: patientsCount },
    { count: todayAppointmentsCount },
    { data: todayAppointments },
    { data: materials, error: materialsError },
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .neq("status", "cancelled"),
    supabase
      .from("appointments")
      .select("*, patients(full_name, phone)")
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd)
      .neq("status", "cancelled")
      .order("scheduled_at", { ascending: true }),
    supabase.from("materials").select("*"),
  ]);

  const materialsList = materialsError ? [] : (materials ?? []);
  const lowStockCount = materialsList.filter(isLowStock).length;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white shadow-lg shadow-teal-600/20">
        <p className="text-sm font-medium text-teal-100">Bem-vindo de volta</p>
        <h1 className="mt-1 text-2xl font-bold">Painel do consultório</h1>
        <p className="mt-2 capitalize text-teal-100/90">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="Pacientes"
          value={patientsCount ?? 0}
          href="/pacientes"
          color="teal"
        />
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="Consultas hoje"
          value={todayAppointmentsCount ?? 0}
          href="/agenda?view=hoje"
          color="blue"
        />
        <StatCard
          icon={<Package className="h-6 w-6" />}
          label="Estoque baixo"
          value={lowStockCount}
          href="/estoque"
          color="slate"
          alert={lowStockCount > 0}
        />
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200">
            <AlertTriangle className="h-5 w-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-800">
              {lowStockCount} material(is) com estoque baixo
            </p>
            <Link href="/estoque" className="text-sm text-teal-600 hover:underline">
              Verificar estoque →
            </Link>
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-slate-900">Agenda de hoje</h2>
          </div>
          <Link
            href="/agenda?view=hoje"
            className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Ver completa
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="p-6">
          {!todayAppointments?.length ? (
            <div className="py-10 text-center">
              <Calendar className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                Nenhuma consulta agendada para hoje.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {todayAppointments.map((apt) => (
                <li key={apt.id}>
                  <Link
                    href={`/agenda/${apt.id}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-teal-200 hover:bg-teal-50/30"
                  >
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-100 text-teal-800">
                      <span className="text-base font-bold leading-none">
                        {format(new Date(apt.scheduled_at), "HH:mm")}
                      </span>
                      <span className="mt-0.5 text-[10px] font-medium">
                        {apt.duration_minutes}min
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {normalizeRelation(apt.patients)?.full_name ?? "Paciente"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {apt.procedure_type || "Consulta"}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-medium text-teal-800">
                      {APPOINTMENT_STATUS_LABELS[apt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  color,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  color: "teal" | "blue" | "slate";
  alert?: boolean;
}) {
  const colors = {
    teal: "from-teal-500 to-teal-600 shadow-teal-500/20",
    blue: "from-sky-500 to-blue-600 shadow-sky-500/20",
    slate: "from-slate-600 to-slate-700 shadow-slate-500/20",
  };

  return (
    <Link href={href} className="group">
      <div
        className={`rounded-2xl bg-gradient-to-br ${colors[color]} p-5 text-white shadow-lg transition group-hover:scale-[1.02] group-hover:shadow-xl ${alert ? "ring-2 ring-slate-300 ring-offset-2" : ""}`}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          {icon}
        </div>
        <p className="text-3xl font-bold">{value}</p>
        <p className="mt-1 text-sm text-white/80">{label}</p>
      </div>
    </Link>
  );
}
