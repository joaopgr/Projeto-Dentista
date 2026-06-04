"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCPF, formatPhone } from "@/lib/utils";
import { Button, Card, Input, Textarea } from "@/components/ui/form";
import type { Patient } from "@/types/database";

export function PatientForm({ patient }: { patient: Patient }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: patient.full_name,
    email: patient.email || "",
    phone: formatPhone(patient.phone),
    cpf: patient.cpf ? formatCPF(patient.cpf) : "",
    birth_date: patient.birth_date || "",
    address: patient.address || "",
    notes: patient.notes || "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.replace(/\D/g, ""),
        cpf: form.cpf.replace(/\D/g, "") || null,
        birth_date: form.birth_date || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      })
      .eq("id", patient.id);

    if (updateError) {
      setError("Erro ao salvar alterações.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Excluir este paciente? Os agendamentos também serão removidos.")) {
      return;
    }

    setDeleting(true);
    const supabase = createClient();
    await supabase.from("patients").delete().eq("id", patient.id);
    router.push("/pacientes");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo *"
          required
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Telefone *"
            required
            value={form.phone}
            onChange={(e) => update("phone", formatPhone(e.target.value))}
          />
          <Input
            label="CPF"
            value={form.cpf}
            onChange={(e) => update("cpf", formatCPF(e.target.value))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
          />
          <Input
            label="Data de nascimento"
            type="date"
            value={form.birth_date}
            onChange={(e) => update("birth_date", e.target.value)}
          />
        </div>
        <Input
          label="Endereço"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
        />
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
          <Link
            href={`/agenda/novo?paciente=${patient.id}`}
            className="inline-flex items-center rounded-lg border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-100"
          >
            Agendar consulta
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </form>
    </Card>
  );
}

export function PatientPageHeader({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/pacientes"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
        <p className="text-sm text-slate-600">Ficha do paciente</p>
      </div>
    </div>
  );
}
