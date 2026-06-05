"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createPaymentRecord, type PaymentMethod } from "@/lib/finance";
import { parseMoneyInput } from "@/lib/utils";
import {
  defaultPaymentFormState,
  PaymentFormSection,
  type PaymentFormState,
} from "@/components/finance/payment-form-section";
import { Button, Card, Select, Textarea } from "@/components/ui/form";
import { PROCEDURE_TYPES, type Patient } from "@/types/database";

function NewPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("paciente") || "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patientId, setPatientId] = useState(preselected);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentFormState);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from("patients").select("*").order("full_name");
      setPatients(data || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (preselected) setPatientId(preselected);
  }, [preselected]);

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

    const result = await createPaymentRecord(supabase, {
      userId: user.id,
      patientId,
      description: description.trim(),
      procedureAmount: parseMoneyInput(paymentForm.total_amount),
      paymentMethod: paymentForm.payment_method as PaymentMethod,
      feePercent: parseFloat(paymentForm.fee_percent) || 0,
      passFeeToClient: paymentForm.pass_fee_to_client,
      installmentsCount: parseInt(paymentForm.installments_count, 10) || 1,
      firstDueDate: paymentForm.first_due_date,
      notes: notes || paymentForm.notes,
    });

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/financeiro/${result.paymentId}`);
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Paciente *"
          required
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
        >
          <option value="">Selecione</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </Select>

        <Select
          label="Procedimento *"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        >
          <option value="">Selecione</option>
          {PROCEDURE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>

        <PaymentFormSection
          form={paymentForm}
          onChange={updatePayment}
          showNotes={false}
        />

        <Textarea
          label="Observações"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>Registrar</Button>
          <Link
            href="/financeiro"
            className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </Card>
  );
}

export default function NewPaymentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/financeiro" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo lançamento</h1>
          <p className="text-sm text-slate-600">Registre procedimento e forma de pagamento</p>
        </div>
      </div>

      <Suspense fallback={<Card><p className="text-slate-500">Carregando...</p></Card>}>
        <NewPaymentForm />
      </Suspense>
    </div>
  );
}
