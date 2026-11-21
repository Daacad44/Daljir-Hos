"use client";

import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { changePassword, updateProfile, type ProfileState } from "./actions";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

function Status({ state }: { state: ProfileState }) {
  if (state.error) return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>;
  if (state.message) return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>;
  return null;
}

export function ProfileForm({ values }: { values: { full_name: string; phone: string; job_title: string; avatar_url: string | null } }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const [preview, setPreview] = useState<string | null>(values.avatar_url);
  return (
    <form action={action} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">Personal details</h2>
      <div className="flex items-center gap-4">
        <Avatar name={values.full_name || "?"} src={preview} size="lg" />
        <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Change photo
          <input
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
          <input name="full_name" required defaultValue={values.full_name} className={input} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone</span>
          <input name="phone" type="tel" defaultValue={values.phone} className={input} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Job title</span>
          <input name="job_title" defaultValue={values.job_title} className={input} />
        </label>
      </div>
      <Status state={state} />
      <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">Change password</h2>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">New password</span>
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className={input} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</span>
        <input name="confirm" type="password" minLength={8} required autoComplete="new-password" className={input} />
      </label>
      <Status state={state} />
      <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Update password
      </button>
    </form>
  );
}
