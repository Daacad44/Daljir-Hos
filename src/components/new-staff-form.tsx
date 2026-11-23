"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import type { StaffFormState } from "@/app/(app)/staff/actions";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

export function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function PasswordField({ name = "password" }: { name?: string }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={8}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="new-password"
          className={`${input} pr-10`}
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700" aria-label="Show password">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setValue(generatePassword());
          setShow(true);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Generate
      </button>
    </div>
  );
}

export function NewStaffForm({
  action,
  roles,
}: {
  action: (s: StaffFormState, f: FormData) => Promise<StaffFormState>;
  roles: { value: string; label: string; description: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {state.error && <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">{state.error}</div>}
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name *</span>
          <input name="full_name" required className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Email (used to sign in) *</span>
          <input name="email" type="email" required autoComplete="off" className={input} />
        </label>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Password * <span className="font-normal text-slate-400">(at least 8 characters)</span></span>
          <PasswordField />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone</span>
          <input name="phone" type="tel" className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Job title</span>
          <input name="job_title" placeholder="Nurse, Cashier…" className={input} />
        </label>
        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-sm font-medium text-slate-700">Role *</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles
              .filter((r) => r.value !== "pending")
              .map((r) => (
                <label key={r.value} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50/50">
                  <input type="radio" name="role" value={r.value} required defaultChecked={r.value === "receptionist"} className="mt-1 accent-teal-600" />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{r.label}</span>
                    <span className="block text-xs text-slate-500">{r.description}</span>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <Link href="/staff" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </Link>
        <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ action }: { action: (s: StaffFormState, f: FormData) => Promise<StaffFormState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-semibold text-slate-900">Reset password</h2>
        <p className="text-sm text-slate-500">Set a new password and give it to the staff member. They can change it later in My profile.</p>
      </div>
      <PasswordField />
      {state.error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>}
      {state.message && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>}
      <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Set new password
      </button>
    </form>
  );
}
