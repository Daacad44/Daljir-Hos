"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type StaffFormState = { error?: string; message?: string };

/** Admin: update another staff member's details, role and status. */
export async function updateStaff(id: string, _prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const me = await getCurrentUser();
  if (me.role !== "admin") return { error: "Only admins can manage staff." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Name is required." };
  const update: Record<string, unknown> = {
    full_name: fullName,
    phone: String(formData.get("phone") ?? "").trim() || null,
    job_title: String(formData.get("job_title") ?? "").trim() || null,
  };
  if (id !== me.id) {
    // Admins cannot demote or deactivate themselves (avoids locking everyone out)
    const role = String(formData.get("role"));
    if (!STAFF_ROLES.some((r) => r.value === role)) return { error: "Choose a valid role." };
    update.role = role;
    update.is_active = formData.get("is_active") === "on";
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update(update).eq("id", id).select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Staff member not found." };
  revalidatePath("/staff");
  redirect("/staff?saved=1");
}

/** Admin: one-click approve or change role from the list. */
export async function quickSetRole(id: string, role: string) {
  const me = await getCurrentUser();
  if (me.role !== "admin" || id === me.id || !STAFF_ROLES.some((r) => r.value === role)) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ role, is_active: true }).eq("id", id);
  revalidatePath("/staff");
}

/** Admin: activate / deactivate an account. */
export async function setActive(id: string, active: boolean) {
  const me = await getCurrentUser();
  if (me.role !== "admin" || id === me.id) return;
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_active: active }).eq("id", id);
  revalidatePath("/staff");
}
