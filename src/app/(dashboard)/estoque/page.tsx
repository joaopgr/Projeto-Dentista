import Link from "next/link";
import { AlertTriangle, Package, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { MaterialSearch } from "@/components/materials/material-search";
import { getUnitLabel, isLowStock, type Material } from "@/types/database";

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("materials")
    .select("*")
    .order("name", { ascending: true });

  if (q?.trim()) {
    query = query.or(
      `name.ilike.%${q.trim()}%,category.ilike.%${q.trim()}%`
    );
  }

  const { data: materials } = await query;
  const list = (materials as Material[] | null) ?? [];
  const lowStockItems = list.filter(isLowStock);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estoque</h1>
          <p className="text-slate-600">
            {list.length} material(is) · {lowStockItems.length} com estoque baixo
          </p>
        </div>
        <Link
          href="/estoque/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          Novo material
        </Link>
      </div>

      {lowStockItems.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-700">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-semibold">Materiais com estoque baixo</p>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {lowStockItems.map((item) => (
              <li key={item.id}>
                <Link href={`/estoque/${item.id}`} className="hover:underline">
                  {item.name} — {item.quantity} {getUnitLabel(item.unit)} (mín:{" "}
                  {item.min_quantity})
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MaterialSearch defaultValue={q} />

      {!list.length ? (
        <Card className="py-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            {q ? "Nenhum material encontrado" : "Nenhum material cadastrado"}
          </p>
          {!q && (
            <Link
              href="/estoque/novo"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:underline"
            >
              <Plus className="h-4 w-4" />
              Cadastrar primeiro material
            </Link>
          )}
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-700">Material</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 hidden sm:table-cell">
                    Categoria
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Quantidade</th>
                  <th className="px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">
                    Mínimo
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((material) => {
                  const low = isLowStock(material);
                  return (
                    <tr
                      key={material.id}
                      className={low ? "bg-slate-50 hover:bg-slate-100" : "hover:bg-slate-50"}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {low && (
                            <AlertTriangle className="h-4 w-4 shrink-0 text-slate-500" />
                          )}
                          <span className="font-medium text-slate-900">
                            {material.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                        {material.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {material.quantity} {getUnitLabel(material.unit)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {material.min_quantity} {getUnitLabel(material.unit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/estoque/${material.id}`}
                          className="text-sm font-medium text-teal-600 hover:underline"
                        >
                          Ver / Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
