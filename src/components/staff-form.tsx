"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { StaffFormState } from "@/app/(app)/staff/actions";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

export function StaffForm({
  action,
  values,
  roles,
  isSelf,
}: {
  action: (s: StaffFormState, f: FormData) => Promise<StaffFormState>;
  values: { full_name: string; phone: string; job_title: string; role: string; is_active: boolean; email: string };
  roles: { value: string; label: string; description: string }[];
  isSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {state.error && <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">{state.error}</div>}
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
          <p className="text-sm text-slate-800">{values.email || "—"}</p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name *</span>
          <input name="full_name" required defaultValue={values.full_name} className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone</span>
          <input name="phone" type="tel" defaultValue={values.phone} className={input} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Job title</span>
          <input name="job_title" defaultValue={values.job_title} placeholder="Head nurse, Cashier…" className={input} />
        </label>
        <fieldset className="sm:col-span-2" disabled={isSelf}>
          <legend className="mb-2 text-sm font-medium text-slate-700">Role {isSelf && <span className="font-normal text-slate-400">(you cannot change your own role)</span>}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => (
              <label key={r.value} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
                <input type="radio" name="role" value={r.value} defaultChecked={values.role === r.value} className="mt-1 accent-teal-600" />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{r.label}</span>
                  <span className="block text-xs text-slate-500">{r.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {!isSelf && (
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" name="is_active" defaultChecked={values.is_active} className="h-4 w-4 accent-teal-600" />
            Account active (unticked accounts cannot see any records)
          </label>
        )}
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <Link href="/staff" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </Link>
        <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </button>
      </div>
    </form>
  );
}
