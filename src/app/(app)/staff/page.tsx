import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { updateRole } from "./actions";

export const metadata: Metadata = { title: "Staff" };

const ROLES = ["pending", "admin", "doctor", "receptionist", "pharmacist", "accountant"];

export default async function StaffPage() {
  const me = await getCurrentUser();
  if (me.role !== "admin") notFound();

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader title="Staff" description="Approve new accounts and assign roles. Only admins can delete records." />
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(staff ?? []).map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{s.full_name || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{s.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(s.created_at)}</td>
                <td className="px-4 py-3">
                  {s.id === me.id ? (
                    <Badge value="active" label="admin (you)" />
                  ) : (
                    <form action={updateRole.bind(null, s.id)} className="flex items-center gap-2">
                      <select
                        name="role"
                        defaultValue={s.role}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm capitalize outline-none focus:border-teal-500"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button className="rounded-md bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700">Save</button>
                      {s.role === "pending" && <Badge value="pending" label="needs approval" />}
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
