"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkAppointmentConflict, formatConflictMessage } from "@/lib/appointments";
import { combineDateAndTime, splitScheduledAt } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button, Card, Input, Select, Textarea } from "@/components/ui/form";
import {
  APPOINTMENT_STATUS_LABELS,
  DURATION_OPTIONS,
  PROCEDURE_TYPES,
  type AppointmentWithPatient,
} from "@/types/database";

export function AppointmentForm({
  appointment,
}: {
  appointment: AppointmentWithPatient;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const { date: initialDate, time: initialTime } = splitScheduledAt(
    appointment.scheduled_at
  );

  const [form, setForm] = useState({
    scheduled_date: initialDate,
    scheduled_time: initialTime,
    duration_minutes: String(appointment.duration_minutes),
    procedure_type: appointment.procedure_type || "Consulta",
    status: appointment.status,
    notes: appointment.notes || "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const duration = parseInt(form.duration_minutes, 10);

    const { conflict, error: conflictError } = await checkAppointmentConflict(
      supabase,
      {
        date: form.scheduled_date,
        time: form.scheduled_time,
        durationMinutes: duration,
        excludeId: appointment.id,
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

    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        scheduled_at: combineDateAndTime(form.scheduled_date, form.scheduled_time),
        duration_minutes: duration,
        procedure_type: form.procedure_type,
        status: form.status,
        notes: form.notes.trim() || null,
      })
      .eq("id", appointment.id);

    if (updateError) {
      setError("Erro ao salvar.");
      setLoading(false);
      return;
    }

    router.push("/agenda");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Cancelar/excluir este agendamento?")) return;

    setDeleting(true);
    const supabase = createClient();
    await supabase.from("appointments").delete().eq("id", appointment.id);
    router.push("/agenda");
    router.refresh();
  }

  return (
    <Card>
      <div className="mb-4 rounded-lg bg-slate-50 p-3">
        <p className="text-sm text-slate-500">Paciente</p>
        <p className="font-semibold text-slate-900">
          {appointment.patients.full_name}
        </p>
        <Link
          href={`/pacientes/${appointment.patient_id}`}
          className="text-sm text-teal-600 hover:underline"
        >
          Ver ficha do paciente
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Data"
            type="date"
            required
            value={form.scheduled_date}
            onChange={(e) => update("scheduled_date", e.target.value)}
          />
          <Input
            label="Horário"
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
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" loading={loading}>
            Salvar alterações
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </form>
    </Card>
  );
}

export function AppointmentHeader({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/agenda"
        className="icon-btn"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consulta</h1>
        <p className="text-sm capitalize text-slate-600">
          {format(new Date(date), "EEEE, d 'de' MMMM 'às' HH:mm", {
            locale: ptBR,
          })}
        </p>
      </div>
    </div>
  );
}
