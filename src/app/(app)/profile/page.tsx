import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const me = await getCurrentUser();
  const supabase = await createClient();
  const { data: p } = await supabase.from("profiles").select("full_name, phone, job_title, avatar_url").eq("id", me.id).maybeSingle();
  const role = STAFF_ROLES.find((r) => r.value === me.role);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="My profile" description={`${me.email} · ${role?.label ?? me.role}`} />
      <div className="space-y-6">
        <ProfileForm
          values={{ full_name: p?.full_name ?? "", phone: p?.phone ?? "", job_title: p?.job_title ?? "", avatar_url: p?.avatar_url ?? null }}
        />
        <PasswordForm />
      </div>
    </div>
  );
}
