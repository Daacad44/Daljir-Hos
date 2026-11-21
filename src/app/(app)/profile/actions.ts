"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string; message?: string };

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const me = await getCurrentUser();
  const supabase = await createClient();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Name is required." };

  const update: Record<string, unknown> = {
    full_name: fullName,
    phone: String(formData.get("phone") ?? "").trim() || null,
    job_title: String(formData.get("job_title") ?? "").trim() || null,
  };

  const file = formData.get("avatar");
  if (file instanceof File && file.size > 0) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { error: "Photo must be a JPG, PNG or WebP image." };
    if (file.size > 3 * 1024 * 1024) return { error: "Photo must be smaller than 3 MB." };
    const path = `staff/${me.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file, { contentType: file.type });
    if (error) return { error: `Upload failed: ${error.message}` };
    update.avatar_url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", me.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}

export async function changePassword(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  await getCurrentUser();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "Passwords do not match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password changed." };
}
