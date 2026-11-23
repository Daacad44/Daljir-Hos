import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Crown, Pencil, Search, ShieldCheck, UserCheck, UserPlus, UserX, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/badge";
import { CopyInviteLink } from "@/components/copy-invite-link";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { quickSetRole, setActive } from "./actions";

export const metadata: Metadata = { title: "Staff" };

type Staff = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  role: string;
  is_active: boolean;
  is_owner: boolean;
  archived_at: string | null;
  avatar_url: string | null;
  created_at: string;
};

export default async function StaffPage({ searchParams }: PageProps<"/staff">) {
  const me = await getCurrentUser();
  if (me.role !== "admin") notFound();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const roleFilter = typeof sp.role === "string" ? sp.role : "";
  const saved = sp.saved === "1";
  const created = typeof sp.created === "string";

  const supabase = await createClient();
  const [{ data }, { data: signIns }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, job_title, role, is_active, is_owner, archived_at, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .returns<Staff[]>(),
    supabase.rpc("staff_last_sign_in"),
  ]);
  const everyone = data ?? [];
  const all = everyone.filter((s) => !s.archived_at);
  const archived = everyone.filter((s) => s.archived_at);
  const lastSeen = new Map(((signIns ?? []) as { id: string; last_sign_in_at: string | null }[]).map((r) => [r.id, r.last_sign_in_at]));

  const staff = (roleFilter === "removed" ? archived : all).filter((s) => {
    if (roleFilter === "removed") return !q || [s.full_name, s.email].some((v) => v?.toLowerCase().includes(q));
    if (roleFilter === "inactive" ? s.is_active : roleFilter && s.role !== roleFilter) return false;
    if (q && ![s.full_name, s.email, s.phone, s.job_title].some((v) => v?.toLowerCase().includes(q))) return false;
    return true;
  });

  const stats = [
    { label: "Total staff", value: all.length, icon: Users, tone: "bg-teal-50 text-teal-700" },
    { label: "Active", value: all.filter((s) => s.is_active && s.role !== "pending").length, icon: UserCheck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Waiting approval", value: all.filter((s) => s.role === "pending").length, icon: ShieldCheck, tone: "bg-amber-50 text-amber-700" },
    { label: "Deactivated", value: all.filter((s) => !s.is_active).length, icon: UserX, tone: "bg-rose-50 text-rose-700" },
  ];
  const filters = [{ value: "", label: "All" }, ...STAFF_ROLES.map((r) => ({ value: r.value, label: r.label })), { value: "inactive", label: "Deactivated" }, { value: "removed", label: `Removed (${archived.length})` }];
  const roleLabel = (v: string) => STAFF_ROLES.find((r) => r.value === v)?.label ?? v;

  return (
    <>
      <PageHeader
        title="Staff management"
        description="Approve new accounts, assign roles and control who can access hospital records."
        actions={
          <>
            <CopyInviteLink />
            <Link
              href="/staff/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              <UserPlus className="h-4 w-4" /> Add staff
            </Link>
          </>
        }
      />

      {created && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Account created. The staff member can sign in now with the email and password you set.
        </div>
      )}

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Staff member updated.
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <form className="relative w-full max-w-sm">
            {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, phone…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </form>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <Link
                key={f.value}
                href={`/staff?${new URLSearchParams({ ...(q ? { q } : {}), ...(f.value ? { role: f.value } : {}) })}`}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  roleFilter === f.value ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {staff.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No staff match this filter.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {staff.map((s) => {
              const isMe = s.id === me.id;
              return (
                <li key={s.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={s.full_name || s.email || "?"} src={s.avatar_url} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                        {s.full_name || "—"}
                        {isMe && <span className="text-xs font-normal text-slate-400">(you)</span>}
                        {s.is_owner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            <Crown className="h-3 w-3" /> Owner
                          </span>
                        )}
                        <Badge value={s.role === "admin" ? "completed" : s.role === "pending" ? "pending" : "scheduled"} label={roleLabel(s.role)} />
                        {!s.is_active && <Badge value="cancelled" label="Deactivated" />}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {s.email ?? "—"}
                        {s.phone ? ` · ${s.phone}` : ""}
                        {s.job_title ? ` · ${s.job_title}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        Joined {formatDate(s.created_at)} · Last sign-in{" "}
                        {lastSeen.get(s.id) ? formatDateTime(lastSeen.get(s.id)) : "never"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {s.archived_at ? (
                      <span className="text-xs text-slate-400">Removed {formatDate(s.archived_at)}</span>
                    ) : (
                    <>
                    {!isMe && s.role === "pending" && (
                      <form action={quickSetRole.bind(null, s.id, "receptionist")}>
                        <button className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">
                          Approve as receptionist
                        </button>
                      </form>
                    )}
                    {!isMe && !s.is_owner && (
                      <form action={setActive.bind(null, s.id, !s.is_active)}>
                        <button
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            s.is_active
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {s.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    )}
                    <Link
                      href={`/staff/${s.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        {STAFF_ROLES.map((r) => (
          <div key={r.value}>
            <p className="font-medium text-slate-900">{r.label}</p>
            <p className="text-slate-500">{r.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
