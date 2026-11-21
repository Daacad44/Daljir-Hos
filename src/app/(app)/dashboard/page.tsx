import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarClock, DollarSign, Stethoscope, Users } from "lucide-react";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime, formatMoney, todayRange } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

type Upcoming = {
  id: string;
  scheduled_at: string;
  status: string;
  reason: string | null;
  patient: { full_name: string } | null;
  doctor: { full_name: string } | null;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const today = todayRange();

  const [patients, doctors, todays, unpaid, medicines, upcoming] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("doctors").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_at", today.start)
      .lt("scheduled_at", today.end),
    supabase.from("invoices").select("amount, amount_paid").in("status", ["unpaid", "partial"]),
    supabase.from("medicines").select("id, name, stock_quantity, reorder_level, unit").order("stock_quantity").limit(50),
    supabase
      .from("appointments")
      .select("id, scheduled_at, status, reason, patient:patients(full_name), doctor:doctors(full_name)")
      .gte("scheduled_at", new Date().toISOString())
      .eq("status", "scheduled")
      .order("scheduled_at")
      .limit(8)
      .returns<Upcoming[]>(),
  ]);

  const outstanding = (unpaid.data ?? []).reduce((sum, i) => sum + Number(i.amount) - Number(i.amount_paid), 0);
  const lowStock = (medicines.data ?? []).filter((m) => m.stock_quantity <= m.reorder_level).slice(0, 6);

  const stats = [
    { label: "Patients", value: patients.count ?? 0, icon: Users, href: "/patients", tone: "bg-teal-50 text-teal-700" },
    { label: "Active doctors", value: doctors.count ?? 0, icon: Stethoscope, href: "/doctors", tone: "bg-sky-50 text-sky-700" },
    { label: "Appointments today", value: todays.count ?? 0, icon: CalendarClock, href: "/appointments", tone: "bg-violet-50 text-violet-700" },
    { label: "Outstanding bills", value: formatMoney(outstanding), icon: DollarSign, href: "/invoices", tone: "bg-amber-50 text-amber-700" },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${user.fullName.split(" ")[0]}`} description="Here is what is happening at the hospital today." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Upcoming appointments</h2>
            <Link href="/appointments/new" className="text-sm font-medium text-teal-700 hover:underline">Book new</Link>
          </header>
          {upcoming.data?.length ? (
            <ul className="divide-y divide-slate-100">
              {upcoming.data.map((a) => (
                <li key={a.id}>
                  <Link href={`/appointments/${a.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{a.patient?.full_name ?? "—"}</p>
                      <p className="text-xs text-slate-500">
                        Dr. {a.doctor?.full_name ?? "—"} {a.reason ? `· ${a.reason}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{formatDateTime(a.scheduled_at)}</span>
                      <Badge value={a.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No upcoming appointments.</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="font-semibold text-slate-900">Low stock</h2>
          </header>
          {lowStock.length ? (
            <ul className="divide-y divide-slate-100">
              {lowStock.map((m) => (
                <li key={m.id}>
                  <Link href={`/medicines/${m.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                    <span className="text-sm font-medium text-slate-900">{m.name}</span>
                    <Badge value={m.stock_quantity === 0 ? "unpaid" : "low"} label={`${m.stock_quantity} ${m.unit}`} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">All medicines are well stocked.</p>
          )}
        </section>
      </div>
    </>
  );
}
