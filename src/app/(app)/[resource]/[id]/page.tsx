import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, CheckCircle2, Pencil, ReceiptText } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/delete-button";
import { Cell, type Row } from "@/components/field-value";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { selectWithRelations } from "@/lib/data";
import { formatDateTime, formatMoney, nowMs } from "@/lib/format";
import { getResource } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";
import { appointmentMessage, invoiceMessage, patientInfoMessage, whatsappLink } from "@/lib/whatsapp";
import { deleteRecord } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/[resource]/[id]">): Promise<Metadata> {
  const { resource } = await params;
  return { title: getResource(resource)?.singular ?? "Not found" };
}

type ApptRow = {
  id: string;
  scheduled_at: string;
  status: string;
  reason: string | null;
  patient?: { id: string; full_name: string; phone: string | null; photo_url: string | null } | null;
  doctor?: { id: string; full_name: string; specialization: string | null; photo_url: string | null } | null;
};
type InvoiceRow = {
  id: string;
  invoice_no: string;
  issued_on: string;
  amount: number;
  amount_paid: number;
  status: string;
  description: string | null;
};
type PersonRef = { id: string; full_name: string; phone: string | null; photo_url: string | null };

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-8 text-center text-sm text-slate-500">{text}</p>;
}

function AppointmentList({ rows, show, patientName }: { rows: ApptRow[]; show: "doctor" | "patient"; patientName?: string }) {
  if (!rows.length) return <Empty text="No appointments yet." />;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((a) => {
        const person = show === "doctor" ? a.doctor : a.patient;
        const name = person?.full_name ?? "—";
        const patient = patientName ?? a.patient?.full_name ?? "";
        const phone = a.patient?.phone ?? null;
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <Link href={`/appointments/${a.id}`} className="flex min-w-0 items-center gap-3 hover:text-teal-700">
              <Avatar name={name} src={person?.photo_url} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {show === "doctor" ? `Dr. ${name}` : name}
                  {show === "doctor" && a.doctor?.specialization ? (
                    <span className="font-normal text-slate-500"> · {a.doctor.specialization}</span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateTime(a.scheduled_at)}
                  {a.reason ? ` · ${a.reason}` : ""}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Badge value={a.status} />
              {a.status === "scheduled" && (
                <WhatsAppButton size="sm" label="Remind" href={whatsappLink(phone, appointmentMessage(patient, a))} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function InvoiceList({ rows, patientName, phone }: { rows: InvoiceRow[]; patientName: string; phone: string | null }) {
  if (!rows.length) return <Empty text="No invoices yet." />;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <Link href={`/invoices/${i.id}`} className="hover:text-teal-700">
            <p className="text-sm font-medium text-slate-900">{i.invoice_no}</p>
            <p className="text-xs text-slate-500">{i.description ?? "—"}</p>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums text-slate-700">{formatMoney(i.amount)}</span>
            <Badge value={i.status} />
            <WhatsAppButton size="sm" label="Send" href={whatsappLink(phone, invoiceMessage(patientName, i))} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function RecordDetailPage({ params, searchParams }: PageProps<"/[resource]/[id]">) {
  const { resource: slug, id } = await params;
  const resource = getResource(slug);
  if (!resource || !UUID.test(id)) notFound();
  const saved = (await searchParams).saved === "1";

  const supabase = await createClient();
  const { data } = await supabase.from(resource.table).select(selectWithRelations(resource)).eq("id", id).maybeSingle();
  if (!data) notFound();
  const record = data as unknown as Row;

  const title = String(record[resource.titleColumn] ?? resource.singular);
  const photo = resource.photoColumn ? (record[resource.photoColumn] as string | null) : null;
  let subtitle: React.ReactNode = resource.singular;
  let whatsapp: { href: string | null; label: string } | null = null;
  const sections: React.ReactNode[] = [];
  const quickActions: React.ReactNode[] = [];

  if (slug === "patients") {
    const [{ data: appts }, { data: invoices }] = await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_at, status, reason, doctor:doctors(id, full_name, specialization, photo_url)")
        .eq("patient_id", id)
        .order("scheduled_at", { ascending: false })
        .returns<ApptRow[]>(),
      supabase
        .from("invoices")
        .select("id, invoice_no, issued_on, amount, amount_paid, status, description")
        .eq("patient_id", id)
        .order("issued_on", { ascending: false })
        .returns<InvoiceRow[]>(),
    ]);
    const now = nowMs();
    const upcoming = (appts ?? []).filter((a) => a.status === "scheduled" && new Date(a.scheduled_at).getTime() >= now).reverse();
    const phone = record.phone as string | null;
    const balance = (invoices ?? []).reduce((s, i) => s + Number(i.amount) - Number(i.amount_paid), 0);
    subtitle = (
      <>
        {String(record.patient_no)} · {record.gender === "female" ? "Female" : "Male"}
        {record.blood_group ? ` · ${record.blood_group}` : ""}
        {balance > 0 ? <span className="ml-2 text-rose-600">Balance {formatMoney(balance)}</span> : null}
      </>
    );
    whatsapp = { label: "Send info on WhatsApp", href: whatsappLink(phone, patientInfoMessage(record as never, upcoming)) };
    quickActions.push(
      <Link key="b" href={`/appointments/new?patient_id=${id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <CalendarPlus className="h-4 w-4" /> Book appointment
      </Link>,
      <Link key="i" href={`/invoices/new?patient_id=${id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <ReceiptText className="h-4 w-4" /> New invoice
      </Link>,
    );
    sections.push(
      <Section key="a" title={`Appointments (${appts?.length ?? 0})`}>
        <AppointmentList rows={(appts ?? []).map((a) => ({ ...a, patient: { id, full_name: title, phone, photo_url: photo } }))} show="doctor" patientName={title} />
      </Section>,
      <Section key="i" title={`Invoices (${invoices?.length ?? 0})`}>
        <InvoiceList rows={invoices ?? []} patientName={title} phone={phone} />
      </Section>,
    );
  }

  if (slug === "doctors") {
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, scheduled_at, status, reason, patient:patients(id, full_name, phone, photo_url)")
      .eq("doctor_id", id)
      .gte("scheduled_at", new Date(nowMs() - 7 * 864e5).toISOString())
      .order("scheduled_at")
      .limit(30)
      .returns<ApptRow[]>();
    const dept = record.department_id__rel as { name: string } | null;
    subtitle = (
      <>
        {String(record.specialization)}
        {dept ? ` · ${dept.name}` : ""}
        {record.years_experience ? ` · ${record.years_experience} yrs experience` : ""}
      </>
    );
    quickActions.push(
      <Link key="b" href={`/appointments/new?doctor_id=${id}`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
        <CalendarPlus className="h-4 w-4" /> Book with this doctor
      </Link>,
    );
    sections.push(
      <Section key="a" title="Schedule (last 7 days and upcoming)">
        <AppointmentList rows={(appts ?? []).map((a) => ({ ...a, doctor: null }))} show="patient" />
      </Section>,
    );
  }

  if (slug === "appointments" || slug === "invoices") {
    const [{ data: patient }, doctorRes] = await Promise.all([
      supabase.from("patients").select("id, full_name, phone, photo_url").eq("id", record.patient_id as string).maybeSingle<PersonRef>(),
      slug === "appointments"
        ? supabase
            .from("doctors")
            .select("id, full_name, specialization, photo_url")
            .eq("id", record.doctor_id as string)
            .maybeSingle<{ id: string; full_name: string; specialization: string; photo_url: string | null }>()
        : Promise.resolve({ data: null }),
    ]);
    const doctor = doctorRes.data;
    const patientName = patient?.full_name ?? "";
    if (slug === "appointments") {
      subtitle = (
        <>
          {formatDateTime(record.scheduled_at as string)} · <Badge value={String(record.status)} />
        </>
      );
      whatsapp = {
        label: "Send to patient on WhatsApp",
        href: whatsappLink(patient?.phone, appointmentMessage(patientName, { ...(record as unknown as ApptRow), doctor })),
      };
    } else {
      subtitle = (
        <>
          {formatMoney(record.amount as number)} · <Badge value={String(record.status)} />
        </>
      );
      whatsapp = {
        label: "Send invoice on WhatsApp",
        href: whatsappLink(patient?.phone, invoiceMessage(patientName, record as never)),
      };
    }
    sections.push(
      <Section key="p" title="People">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {patient && (
            <Link href={`/patients/${patient.id}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-teal-300">
              <Avatar name={patient.full_name} src={patient.photo_url} />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Patient</p>
                <p className="font-medium text-slate-900">{patient.full_name}</p>
                <p className="text-xs text-slate-500">{patient.phone ?? "No phone"}</p>
              </div>
            </Link>
          )}
          {doctor && (
            <Link href={`/doctors/${doctor.id}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 hover:border-teal-300">
              <Avatar name={doctor.full_name} src={doctor.photo_url} />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Doctor</p>
                <p className="font-medium text-slate-900">Dr. {doctor.full_name}</p>
                <p className="text-xs text-slate-500">{doctor.specialization}</p>
              </div>
            </Link>
          )}
        </div>
      </Section>,
    );
  }

  const detailFields = resource.fields.filter(
    (f) => f.type !== "image" && !(slug === "appointments" && (f.name === "patient_id" || f.name === "doctor_id")) && !(slug === "invoices" && f.name === "patient_id"),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to {resource.title.toLowerCase()}
      </Link>

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {resource.singular} saved.
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {resource.photoColumn && <Avatar name={title} src={photo} size="xl" />}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {slug === "doctors" ? `Dr. ${title}` : title}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {whatsapp && <WhatsAppButton href={whatsapp.href} label={whatsapp.label} />}
            <Link
              href={`/${slug}/${id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <DeleteButton action={deleteRecord.bind(null, slug, id)} label={resource.singular} redirectTo={`/${slug}`} variant="button" />
          </div>
        </div>
        {quickActions.length > 0 && <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">{quickActions}</div>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <header className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Details</h2>
          </header>
          <dl className="divide-y divide-slate-100">
            {detailFields.map((f) => (
              <div key={f.name} className="px-5 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{f.label}</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  <Cell field={f} row={record} full />
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="space-y-6 lg:col-span-2">{sections.length ? sections : null}</div>
      </div>
    </div>
  );
}
