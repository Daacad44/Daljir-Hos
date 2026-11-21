import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "pending" | "admin" | "doctor" | "receptionist" | "pharmacist" | "accountant";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: StaffRole;
};

/** The signed-in staff member, or a redirect to /login. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: profile?.full_name || data.user.email || "Staff",
    role: (profile?.role as StaffRole) ?? "pending",
  };
});
