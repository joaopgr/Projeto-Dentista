"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Select, Textarea } from "@/components/ui/form";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_UNITS,
  getUnitLabel,
  isLowStock,
  type Material,
} from "@/types/database";

export function MaterialForm({ material }: { material: Material }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("1");
  const [form, setForm] = useState({
    name: material.name,
    category: material.category || "",
    quantity: String(material.quantity),
    unit: material.unit,
    min_quantity: String(material.min_quantity),
    notes: material.notes || "",
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
      .from("materials")
      .update({
        name: form.name.trim(),
        category: form.category || null,
        quantity: parseFloat(form.quantity) || 0,
        unit: form.unit,
        min_quantity: parseFloat(form.min_quantity) || 0,
        notes: form.notes.trim() || null,
      })
      .eq("id", material.id);

    if (updateError) {
      setError("Erro ao salvar alterações.");
      setLoading(false);
      return;
    }

    router.push("/estoque");
    router.refresh();
  }

  async function adjustStock(delta: number) {
    const amount = parseFloat(adjustAmount) || 0;
    if (amount <= 0) return;

    setAdjusting(true);
    const newQty = Math.max(0, material.quantity + delta * amount);

    const supabase = createClient();
    await supabase
      .from("materials")
      .update({ quantity: newQty })
      .eq("id", material.id);

    setForm((prev) => ({ ...prev, quantity: String(newQty) }));
    setAdjusting(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Excluir este material do estoque?")) return;

    setDeleting(true);
    const supabase = createClient();
    await supabase.from("materials").delete().eq("id", material.id);
    router.push("/estoque");
    router.refresh();
  }

  const lowStock = isLowStock({
    quantity: parseFloat(form.quantity) || 0,
    min_quantity: parseFloat(form.min_quantity) || 0,
  });

  return (
    <Card>
      {lowStock && (
        <div className="mb-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          Estoque baixo — quantidade no ou abaixo do mínimo.
        </div>
      )}

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-sm font-medium text-slate-700">Ajuste rápido</p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            className="w-24"
          />
          <span className="text-sm text-slate-500">{getUnitLabel(form.unit)}</span>
          <button
            type="button"
            onClick={() => adjustStock(1)}
            disabled={adjusting}
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            Entrada
          </button>
          <button
            type="button"
            onClick={() => adjustStock(-1)}
            disabled={adjusting}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            <Minus className="h-4 w-4" />
            Saída
          </button>
        </div>
        <p className="mt-2 text-lg font-bold text-slate-900">
          Saldo atual: {form.quantity} {getUnitLabel(form.unit)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome do material *"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
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
            label="Quantidade atual"
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
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" loading={loading}>
            Salvar alterações
          </Button>
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

export function MaterialPageHeader({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/estoque"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
        <p className="text-sm text-slate-600">Controle de estoque</p>
      </div>
    </div>
  );
}
