import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientForm, PatientPageHeader } from "@/components/patients/patient-form";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (!patient) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PatientPageHeader name={patient.full_name} />
      <PatientForm patient={patient} />
    </div>
  );
}
