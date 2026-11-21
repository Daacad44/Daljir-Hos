"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getResource, type Field } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";
import { fromDateTimeInput } from "@/lib/format";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

function parseField(field: Field, raw: FormDataEntryValue | null): { value: unknown; error?: string } {
  if (field.type === "boolean") return { value: raw === "on" };
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) {
    return field.required ? { value: null, error: `${field.label} is required` } : { value: null };
  }
  switch (field.type) {
    case "number": {
      const n = Number(text);
      if (!Number.isInteger(n) || n < 0) return { value: null, error: `${field.label} must be a whole number` };
      return { value: n };
    }
    case "money": {
      const n = Number(text);
      if (!Number.isFinite(n) || n < 0) return { value: null, error: `${field.label} must be a positive amount` };
      return { value: Math.round(n * 100) / 100 };
    }
    case "datetime":
      return { value: fromDateTimeInput(text) };
    case "email":
      return /^\S+@\S+\.\S+$/.test(text) ? { value: text } : { value: null, error: "Enter a valid email" };
    case "select":
      return field.options?.some((o) => o.value === text)
        ? { value: text }
        : { value: null, error: `Choose a valid ${field.label.toLowerCase()}` };
    default:
      return { value: text };
  }
}

function friendlyError(message: string) {
  if (message.includes("row-level security")) return "You do not have permission to do this.";
  if (message.includes("duplicate key")) return "A record with this value already exists.";
  if (message.includes("violates foreign key")) return "This record is linked to other records and cannot be changed this way.";
  if (message.includes("violates check constraint")) return "One of the values is not allowed. Please check the form.";
  return message;
}

export async function saveRecord(
  slug: string,
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const resource = getResource(slug);
  if (!resource) return { error: "Unknown module" };

  const payload: Record<string, unknown> = {};
  const fieldErrors: Record<string, string> = {};
  for (const field of resource.fields) {
    if (field.readOnly) continue;
    const { value, error } = parseField(field, formData.get(field.name));
    if (error) fieldErrors[field.name] = error;
    else payload[field.name] = value;
  }
  if (Object.keys(fieldErrors).length) return { error: "Please fix the highlighted fields.", fieldErrors };

  const supabase = await createClient();
  const query = id
    ? supabase.from(resource.table).update(payload).eq("id", id).select("id")
    : supabase.from(resource.table).insert(payload).select("id");
  const { data, error } = await query;
  if (error) return { error: friendlyError(error.message) };
  if (!data?.length) return { error: "You do not have permission to do this." };

  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard");
  redirect(`/${slug}?saved=1`);
}

export async function deleteRecord(slug: string, id: string): Promise<FormState> {
  const resource = getResource(slug);
  if (!resource) return { error: "Unknown module" };

  const supabase = await createClient();
  const { data, error } = await supabase.from(resource.table).delete().eq("id", id).select("id");
  if (error) return { error: friendlyError(error.message) };
  if (!data?.length) return { error: "Only an admin can delete records." };

  revalidatePath(`/${slug}`);
  revalidatePath("/dashboard");
  return {};
}
