"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { Field, Option } from "@/lib/resources";
import type { FormState } from "@/app/(app)/[resource]/actions";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

export function ResourceForm({
  fields,
  values,
  relationOptions,
  action,
  cancelHref,
  submitLabel,
}: {
  fields: Field[];
  values: Record<string, string | boolean>;
  relationOptions: Record<string, Option[]>;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {state.error && (
        <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">{state.error}</div>
      )}
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        {fields
          .filter((f) => !f.readOnly)
          .map((field) => {
            const error = state.fieldErrors?.[field.name];
            const value = values[field.name];
            const common = {
              id: field.name,
              name: field.name,
              required: field.required,
              "aria-invalid": Boolean(error),
            };
            let control: React.ReactNode;
            switch (field.type) {
              case "textarea":
                control = <textarea {...common} rows={4} defaultValue={String(value ?? "")} placeholder={field.placeholder} className={inputClass} />;
                break;
              case "boolean":
                control = (
                  <label className="flex items-center gap-2 pt-1 text-sm text-slate-700">
                    <input type="checkbox" name={field.name} defaultChecked={value !== false} className="h-4 w-4 rounded border-slate-300 accent-teal-600" />
                    {field.label}
                  </label>
                );
                break;
              case "select":
              case "relation": {
                const options = field.type === "select" ? field.options ?? [] : relationOptions[field.name] ?? [];
                control = (
                  <select {...common} defaultValue={String(value ?? "")} className={inputClass}>
                    <option value="">Select…</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                );
                break;
              }
              default: {
                const type =
                  field.type === "money" || field.type === "number"
                    ? "number"
                    : field.type === "datetime"
                      ? "datetime-local"
                      : field.type;
                control = (
                  <input
                    {...common}
                    type={type}
                    step={field.type === "money" ? "0.01" : field.type === "number" ? "1" : undefined}
                    min={field.type === "money" || field.type === "number" ? 0 : undefined}
                    defaultValue={String(value ?? "")}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                );
              }
            }
            return (
              <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
                {field.type !== "boolean" && (
                  <label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-slate-700">
                    {field.label}
                    {field.required && <span className="text-rose-500"> *</span>}
                  </label>
                )}
                {control}
                {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
              </div>
            );
          })}
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <Link href={cancelHref} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </Link>
        <button
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
