import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NewStaffForm } from "@/components/new-staff-form";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { createStaff } from "../actions";

export const metadata: Metadata = { title: "Add staff" };

export default async function NewStaffPage() {
  const me = await getCurrentUser();
  if (me.role !== "admin") notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/staff" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to staff
      </Link>
      <PageHeader
        title="Add staff member"
        description="The account is ready to use immediately. Give the email and password to the staff member."
      />
      <NewStaffForm action={createStaff} roles={STAFF_ROLES} />
    </div>
  );
}
