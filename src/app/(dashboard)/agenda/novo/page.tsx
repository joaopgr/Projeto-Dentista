"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkAppointmentConflict, formatConflictMessage } from "@/lib/appointments";
import { createPaymentRecord, type PaymentMethod } from "@/lib/finance";
import { combineDateAndTime, parseMoneyInput } from "@/lib/utils";
import {
  defaultPaymentFormState,
  PaymentFormSection,
  type PaymentFormState,
} from "@/components/finance/payment-form-section";
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
  const [registerPayment, setRegisterPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentFormState);
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

  function updatePayment(field: keyof PaymentFormState, value: string | boolean) {
    setPaymentForm((prev) => ({ ...prev, [field]: value }));
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

    if (registerPayment) {
      const amount = parseMoneyInput(paymentForm.total_amount);
      if (amount <= 0) {
        setError("Informe o valor do procedimento para registrar o pagamento.");
        setLoading(false);
        return;
      }
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

    const { data: appointment, error: insertError } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        patient_id: form.patient_id,
        scheduled_at: combineDateAndTime(form.scheduled_date, form.scheduled_time),
        duration_minutes: duration,
        procedure_type: form.procedure_type,
        status: form.status,
        notes: form.notes.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !appointment) {
      setError("Erro ao criar agendamento.");
      setLoading(false);
      return;
    }

    if (registerPayment) {
      const result = await createPaymentRecord(supabase, {
        userId: user.id,
        patientId: form.patient_id,
        appointmentId: appointment.id,
        description: form.procedure_type,
        procedureAmount: parseMoneyInput(paymentForm.total_amount),
        paymentMethod: paymentForm.payment_method as PaymentMethod,
        feePercent: parseFloat(paymentForm.fee_percent) || 0,
        passFeeToClient: paymentForm.pass_fee_to_client,
        installmentsCount: parseInt(paymentForm.installments_count, 10) || 1,
        firstDueDate: paymentForm.first_due_date,
        notes: paymentForm.notes,
      });

      if ("error" in result) {
        setError(`Agendamento criado, mas ${result.error.toLowerCase()}`);
        setLoading(false);
        return;
      }
    }

    router.push(`/agenda/${appointment.id}`);
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

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={registerPayment}
                onChange={(e) => setRegisterPayment(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">
                  Registrar pagamento agora
                </span>
                <span className="mt-0.5 block text-slate-500">
                  Informe valor e forma de pagamento junto com o agendamento.
                </span>
              </span>
            </label>

            {registerPayment && (
              <PaymentFormSection form={paymentForm} onChange={updatePayment} />
            )}

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
