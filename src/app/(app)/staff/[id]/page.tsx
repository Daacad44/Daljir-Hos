import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/page-header";
import { StaffForm } from "@/components/staff-form";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateStaff } from "../actions";

export const metadata: Metadata = { title: "Edit staff" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditStaffPage({ params }: PageProps<"/staff/[id]">) {
  const me = await getCurrentUser();
  const { id } = await params;
  if (me.role !== "admin" || !UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("profiles")
    .select("full_name, email, phone, job_title, role, is_active, avatar_url")
    .eq("id", id)
    .maybeSingle();
  if (!s) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/staff" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to staff
      </Link>
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={s.full_name || s.email || "?"} src={s.avatar_url} size="lg" />
        <PageHeader title={s.full_name || "Staff member"} description="Update details, role and access." />
      </div>
      <StaffForm
        action={updateStaff.bind(null, id)}
        values={{
          full_name: s.full_name ?? "",
          email: s.email ?? "",
          phone: s.phone ?? "",
          job_title: s.job_title ?? "",
          role: s.role,
          is_active: s.is_active,
        }}
        roles={STAFF_ROLES}
        isSelf={id === me.id}
      />
    </div>
  );
}
