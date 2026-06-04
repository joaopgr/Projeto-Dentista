"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCPF, formatPhone } from "@/lib/utils";
import { Button, Card, Input, Textarea } from "@/components/ui/form";

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: "",
    address: "",
    notes: "",
  });

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
      setError("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("patients").insert({
      user_id: user.id,
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.replace(/\D/g, ""),
      cpf: form.cpf.replace(/\D/g, "") || null,
      birth_date: form.birth_date || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    });

    if (insertError) {
      setError("Erro ao cadastrar paciente. Tente novamente.");
      setLoading(false);
      return;
    }

    router.push("/pacientes");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/pacientes"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo paciente</h1>
          <p className="text-sm text-slate-600">Preencha os dados do paciente</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome completo *"
            required
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Maria da Silva"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Telefone *"
              required
              value={form.phone}
              onChange={(e) => update("phone", formatPhone(e.target.value))}
              placeholder="(11) 99999-9999"
            />
            <Input
              label="CPF"
              value={form.cpf}
              onChange={(e) => update("cpf", formatCPF(e.target.value))}
              placeholder="000.000.000-00"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="paciente@email.com"
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
            placeholder="Rua, número, bairro, cidade"
          />
          <Textarea
            label="Observações"
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Alergias, histórico, preferências..."
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Salvar paciente
            </Button>
            <Link
              href="/pacientes"
              className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
