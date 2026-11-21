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
  isActive: boolean;
  avatarUrl: string | null;
};

export const STAFF_ROLES: { value: StaffRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full access, manages staff, can delete records" },
  { value: "doctor", label: "Doctor", description: "Patients, appointments and notes" },
  { value: "receptionist", label: "Receptionist", description: "Registration, appointments and billing" },
  { value: "pharmacist", label: "Pharmacist", description: "Pharmacy stock" },
  { value: "accountant", label: "Accountant", description: "Billing and payments" },
  { value: "pending", label: "Pending", description: "Waiting for approval, sees no data" },
];

/** The signed-in staff member, or a redirect to /login. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, is_active, avatar_url")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName: profile?.full_name || data.user.email || "Staff",
    role: (profile?.role as StaffRole) ?? "pending",
    isActive: profile?.is_active ?? true,
    avatarUrl: profile?.avatar_url ?? null,
  };
});
