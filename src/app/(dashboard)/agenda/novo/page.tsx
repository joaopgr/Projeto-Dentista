"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkAppointmentConflict, formatConflictMessage } from "@/lib/appointments";
import { combineDateAndTime } from "@/lib/utils";
import { Button, Card, Input, Select, Textarea } from "@/components/ui/form";
import { APPOINTMENT_STATUS_LABELS, DURATION_OPTIONS, PROCEDURE_TYPES } from "@/types/database";
import type { Patient } from "@/types/database";

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("paciente") || "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    patient_id: preselected,
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: "60",
    procedure_type: "Consulta",
    status: "scheduled",
    notes: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("patients")
        .select("*")
        .order("full_name");

      setPatients(data || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (preselected) {
      setForm((prev) => ({ ...prev, patient_id: preselected }));
    }
  }, [preselected]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sessão expirada.");
      setLoading(false);
      return;
    }

    if (!form.scheduled_date || !form.scheduled_time) {
      setError("Informe a data e o horário.");
      setLoading(false);
      return;
    }

    const duration = parseInt(form.duration_minutes, 10);

    const { conflict, error: conflictError } = await checkAppointmentConflict(
      supabase,
      {
        date: form.scheduled_date,
        time: form.scheduled_time,
        durationMinutes: duration,
      }
    );

    if (conflictError) {
      setError(conflictError);
      setLoading(false);
      return;
    }

    if (conflict) {
      setError(formatConflictMessage(conflict));
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      user_id: user.id,
      patient_id: form.patient_id,
      scheduled_at: combineDateAndTime(form.scheduled_date, form.scheduled_time),
      duration_minutes: duration,
      procedure_type: form.procedure_type,
      status: form.status,
      notes: form.notes.trim() || null,
    });

    if (insertError) {
      setError("Erro ao criar agendamento.");
      setLoading(false);
      return;
    }

    router.push("/agenda");
    router.refresh();
  }

  return (
    <>
      {patients.length === 0 ? (
        <Card className="text-center">
          <p className="text-slate-600">
            Você precisa cadastrar um paciente antes de agendar.
          </p>
          <Link
            href="/pacientes/novo"
            className="mt-3 inline-block text-sm font-medium text-teal-600 hover:underline"
          >
            Cadastrar paciente
          </Link>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Paciente *"
              required
              value={form.patient_id}
              onChange={(e) => update("patient_id", e.target.value)}
            >
              <option value="">Selecione o paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </Select>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Data *"
                type="date"
                required
                value={form.scheduled_date}
                onChange={(e) => update("scheduled_date", e.target.value)}
              />
              <Input
                label="Horário *"
                type="time"
                required
                step="900"
                value={form.scheduled_time}
                onChange={(e) => update("scheduled_time", e.target.value)}
              />
              <Select
                label="Duração"
                value={form.duration_minutes}
                onChange={(e) => update("duration_minutes", e.target.value)}
              >
                {DURATION_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Procedimento"
                value={form.procedure_type}
                onChange={(e) => update("procedure_type", e.target.value)}
              >
                {PROCEDURE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Observações"
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Informações adicionais sobre a consulta"
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>
                Agendar consulta
              </Button>
              <Link
                href="/agenda"
                className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}

export default function NewAppointmentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/agenda"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo agendamento</h1>
          <p className="text-sm text-slate-600">Marque uma consulta para o paciente</p>
        </div>
      </div>

      <Suspense fallback={<Card><p className="text-slate-500">Carregando...</p></Card>}>
        <NewAppointmentForm />
      </Suspense>
    </div>
  );
}
