import { Ban, Clock } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { resources } from "@/lib/resources";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  const items = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    ...resources.map((r) => ({ href: `/${r.slug}`, label: r.title, icon: r.icon })),
    ...(user.role === "admin" ? [{ href: "/staff", label: "Staff", icon: "staff" }] : []),
  ];

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar items={items} user={{ fullName: user.fullName, role: user.role, avatarUrl: user.avatarUrl }} signOut={signOut} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8">
        {!user.isActive ? (
          <div className="mx-auto mt-16 max-w-md rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
            <Ban className="mx-auto h-10 w-10 text-rose-600" />
            <h1 className="mt-4 text-lg font-semibold text-slate-900">Account deactivated</h1>
            <p className="mt-2 text-sm text-slate-600">Your account has been deactivated. Contact the hospital administrator.</p>
          </div>
        ) : user.role === "pending" ? (
          <div className="mx-auto mt-16 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-amber-600" />
            <h1 className="mt-4 text-lg font-semibold text-slate-900">Waiting for approval</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your account was created. An administrator needs to assign you a role before you can see hospital records.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
