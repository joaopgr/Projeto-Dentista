"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Select, Textarea } from "@/components/ui/form";
import { MATERIAL_CATEGORIES, MATERIAL_UNITS } from "@/types/database";

export default function NewMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "0",
    unit: "un",
    min_quantity: "5",
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
      setError("Sessão expirada.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("materials").insert({
      user_id: user.id,
      name: form.name.trim(),
      category: form.category || null,
      quantity: parseFloat(form.quantity) || 0,
      unit: form.unit,
      min_quantity: parseFloat(form.min_quantity) || 0,
      notes: form.notes.trim() || null,
    });

    if (insertError) {
      setError("Erro ao cadastrar material. Execute a migração SQL no Supabase.");
      setLoading(false);
      return;
    }

    router.push("/estoque");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/estoque"
          className="icon-btn"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Novo material</h1>
          <p className="text-sm text-slate-600">Adicione um item ao estoque</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do material *"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Luvas descartáveis M"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Categoria"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Selecione</option>
              {MATERIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
            <Select
              label="Unidade"
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
            >
              {MATERIAL_UNITS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Quantidade inicial"
              type="number"
              min="0"
              step="0.01"
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
            />
            <Input
              label="Estoque mínimo (alerta)"
              type="number"
              min="0"
              step="0.01"
              value={form.min_quantity}
              onChange={(e) => update("min_quantity", e.target.value)}
            />
          </div>
          <Textarea
            label="Observações"
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Marca, fornecedor, local de armazenamento..."
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Salvar material
            </Button>
            <Link
              href="/estoque"
              className="btn-ghost"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
