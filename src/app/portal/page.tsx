import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  CLIENT_SESSION_COOKIE,
  verifyClientSessionToken,
} from "@/lib/client-session";
import { getPortalData } from "@/lib/portal/data";
import { ClientPortalView } from "@/components/portal/client-portal-view";

export default async function PortalPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_SESSION_COOKIE)?.value;
  const patientId = token ? await verifyClientSessionToken(token) : null;

  if (!patientId) {
    redirect("/login");
  }

  const data = await getPortalData(patientId);

  if (!data) {
    redirect("/login");
  }

  return (
    <ClientPortalView
      patient={data.patient}
      upcomingAppointments={data.upcomingAppointments}
      pastAppointments={data.pastAppointments}
      payments={data.payments}
    />
  );
}
