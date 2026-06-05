import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PatientPageHeader } from "@/components/patients/patient-form";
import { PatientDetailView } from "@/components/patients/patient-detail-view";

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

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", id)
    .order("scheduled_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("*, payment_installments(*)")
    .eq("patient_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PatientPageHeader name={patient.full_name} />
      <PatientDetailView
        patient={patient}
        appointments={appointments || []}
        payments={payments || []}
      />
    </div>
  );
}
