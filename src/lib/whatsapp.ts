import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

export const HOSPITAL_NAME = "Daljir Hospital";

/** Normalise a Somali phone number to international digits for wa.me (e.g. 252615xxxxxx). */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("252")) return digits.length >= 11 ? digits : null;
  if (digits.startsWith("0")) digits = digits.slice(1);
  // Local Somali mobile numbers are 9 digits (61x, 62x, 63x, 65x, 68x, 69x, 7x, 90x…)
  if (digits.length === 9) return `252${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

type Patient = {
  full_name: string;
  patient_no?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  blood_group?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Appointment = {
  scheduled_at: string;
  status?: string | null;
  reason?: string | null;
  doctor?: { full_name: string; specialization?: string | null } | null;
};

type Invoice = {
  invoice_no: string;
  issued_on: string;
  amount: number | string;
  amount_paid: number | string;
  status: string;
  description?: string | null;
};

const statusSo: Record<string, string> = {
  scheduled: "La qorsheeyay",
  completed: "La dhammeeyay",
  cancelled: "La joojiyay",
  no_show: "Lama iman",
  unpaid: "Lama bixin",
  partial: "Qayb ayaa la bixiyay",
  paid: "La bixiyay",
};

export function patientInfoMessage(p: Patient, upcoming: Appointment[] = []) {
  const lines = [
    `Asc ${p.full_name},`,
    `Kani waa xogtaada diiwaanka ${HOSPITAL_NAME}:`,
    "",
    `🆔 Lambarka bukaanka: ${p.patient_no ?? "—"}`,
    `👤 Magaca: ${p.full_name}`,
    p.gender ? `⚧ Jinsiga: ${p.gender === "male" ? "Lab" : "Dheddig"}` : null,
    p.date_of_birth ? `🎂 Taariikhda dhalashada: ${formatDate(p.date_of_birth)}` : null,
    p.blood_group ? `🩸 Nooca dhiigga: ${p.blood_group}` : null,
    p.phone ? `📞 Telefoon: ${p.phone}` : null,
    p.address ? `📍 Cinwaan: ${p.address}` : null,
  ];
  if (upcoming.length) {
    lines.push("", "📅 Ballamahaaga soo socda:");
    upcoming.forEach((a) =>
      lines.push(`• ${formatDateTime(a.scheduled_at)} — Dr. ${a.doctor?.full_name ?? ""}${a.doctor?.specialization ? ` (${a.doctor.specialization})` : ""}`),
    );
  }
  lines.push("", `Mahadsanid, ${HOSPITAL_NAME} 🏥`);
  return lines.filter((l) => l !== null).join("\n");
}

export function appointmentMessage(patientName: string, a: Appointment) {
  return [
    `Asc ${patientName},`,
    `Waxaan kuu xaqiijinaynaa ballantaada ${HOSPITAL_NAME}:`,
    "",
    `👨‍⚕️ Dhakhtarka: Dr. ${a.doctor?.full_name ?? "—"}${a.doctor?.specialization ? ` (${a.doctor.specialization})` : ""}`,
    `📅 Waqtiga: ${formatDateTime(a.scheduled_at)}`,
    a.reason ? `📝 Sababta: ${a.reason}` : null,
    a.status ? `📌 Xaaladda: ${statusSo[a.status] ?? a.status}` : null,
    "",
    "Fadlan 15 daqiiqo ka hor imow, soona qaado warqadaha caafimaadkaaga.",
    `Mahadsanid, ${HOSPITAL_NAME} 🏥`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function invoiceMessage(patientName: string, i: Invoice) {
  const balance = Number(i.amount) - Number(i.amount_paid);
  return [
    `Asc ${patientName},`,
    `Kani waa biilkaaga ${HOSPITAL_NAME}:`,
    "",
    `🧾 Lambarka: ${i.invoice_no}`,
    `📅 Taariikh: ${formatDate(i.issued_on)}`,
    i.description ? `🩺 Adeegyada: ${i.description}` : null,
    `💵 Wadarta: ${formatMoney(i.amount)}`,
    `✅ La bixiyay: ${formatMoney(i.amount_paid)}`,
    `⏳ Haraaga: ${formatMoney(balance)}`,
    `📌 Xaaladda: ${statusSo[i.status] ?? i.status}`,
    "",
    `Mahadsanid, ${HOSPITAL_NAME} 🏥`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
