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
  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("is_owner").eq("id", id).maybeSingle();
  if (id !== me.id && !target?.is_owner) {
    // Admins cannot demote or deactivate themselves or the owner
    const role = String(formData.get("role"));
    if (!STAFF_ROLES.some((r) => r.value === role)) return { error: "Choose a valid role." };
    update.role = role;
    update.is_active = formData.get("is_active") === "on";
  }

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

function dbError(message: string) {
  // Messages raised by our SQL functions are already user-friendly
  return message.replace(/^.*?ERROR:\s*/, "");
}

/** Admin: create a new staff account with email + password and a role. */
export async function createStaff(_prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const me = await getCurrentUser();
  if (me.role !== "admin") return { error: "Only admins can create staff accounts." };

  const role = String(formData.get("role") ?? "");
  if (!STAFF_ROLES.some((r) => r.value === role)) return { error: "Choose a role." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_create_user", {
    p_email: String(formData.get("email") ?? ""),
    p_password: String(formData.get("password") ?? ""),
    p_full_name: String(formData.get("full_name") ?? ""),
    p_role: role,
    p_phone: String(formData.get("phone") ?? ""),
    p_job_title: String(formData.get("job_title") ?? ""),
  });
  if (error) return { error: dbError(error.message) };
  revalidatePath("/staff");
  redirect(`/staff?created=${data}`);
}

/** Admin: set a new password for a staff member. */
export async function resetStaffPassword(id: string, _prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const me = await getCurrentUser();
  if (me.role !== "admin") return { error: "Only admins can reset passwords." };
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_password", { p_user_id: id, p_password: password });
  if (error) return { error: dbError(error.message) };
  return { message: "Password changed. Share the new password with the staff member." };
}

/** Admin: permanently delete a staff account. */
export async function deleteStaff(id: string): Promise<{ error?: string }> {
  const me = await getCurrentUser();
  if (me.role !== "admin") return { error: "Only admins can delete staff." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: id });
  if (error) return { error: dbError(error.message) };
  revalidatePath("/staff");
  return {};
}
