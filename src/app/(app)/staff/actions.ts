"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ROLES = ["pending", "admin", "doctor", "receptionist", "pharmacist", "accountant"];

export async function updateRole(id: string, formData: FormData) {
  const me = await getCurrentUser();
  if (me.role !== "admin") return;
  const role = String(formData.get("role"));
  if (!ROLES.includes(role) || id === me.id) return; // admins cannot demote themselves

  const supabase = await createClient();
  await supabase.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/staff");
}
