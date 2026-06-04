import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaterialForm, MaterialPageHeader } from "@/components/materials/material-form";

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: material } = await supabase
    .from("materials")
    .select("*")
    .eq("id", id)
    .single();

  if (!material) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <MaterialPageHeader name={material.name} />
      <MaterialForm material={material} />
    </div>
  );
}
