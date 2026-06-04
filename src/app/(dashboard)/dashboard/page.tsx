import Link from "next/link";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Calendar, Package, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/form";
import { APPOINTMENT_STATUS_LABELS, isLowStock, type Material } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  const [
    { count: patientsCount },
    { count: todayAppointmentsCount },
    { data: todayAppointments },
    { data: materials },
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

  const lowStockCount =
    (materials as Material[] | null)?.filter(isLowStock).length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
        <p className="text-slate-600">
          {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Pacientes"
          value={patientsCount ?? 0}
          href="/pacientes"
        />
        <StatCard
          icon={<Calendar className="h-5 w-5" />}
          label="Consultas hoje"
          value={todayAppointmentsCount ?? 0}
          href="/agenda?view=hoje"
        />
        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Estoque baixo"
          value={lowStockCount}
          href="/estoque"
          alert={lowStockCount > 0}
        />
        <Link
          href="/agenda/novo"
          className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50 p-5 text-teal-700 transition hover:border-teal-400 hover:bg-teal-100"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Novo agendamento</p>
            <p className="text-sm text-teal-600">Marcar consulta</p>
          </div>
        </Link>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Agenda de hoje
          </h2>
          <Link
            href="/agenda?view=hoje"
            className="text-sm font-medium text-teal-600 hover:underline"
          >
            Ver agenda completa
          </Link>
        </div>

        {!todayAppointments?.length ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhuma consulta agendada para hoje.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {todayAppointments.map((apt) => (
              <li key={apt.id}>
                <Link
                  href={`/agenda/${apt.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {format(new Date(apt.scheduled_at), "HH:mm")} —{" "}
                      {apt.patients?.full_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {apt.procedure_type || "Consulta"} · {apt.duration_minutes} min
                    </p>
                  </div>
                  <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                    {APPOINTMENT_STATUS_LABELS[apt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          href="/pacientes/novo"
          title="Cadastrar paciente"
          description="Adicione um novo paciente"
        />
        <QuickAction
          href="/agenda/novo"
          title="Agendar consulta"
          description="Marque um atendimento"
        />
        <QuickAction
          href="/estoque/novo"
          title="Adicionar material"
          description="Controle de estoque"
        />
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">
              {lowStockCount} material(is) com estoque baixo
            </p>
            <Link href="/estoque" className="text-sm text-amber-700 hover:underline">
              Ver estoque →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  alert?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={`transition hover:shadow-md ${alert ? "ring-2 ring-amber-200" : ""}`}>
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              alert ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
    >
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Link>
  );
}
