import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const mode = (await searchParams).mode === "signup" ? "up" : "in";
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-teal-700 to-teal-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-bold">
          <HeartPulse className="h-6 w-6" /> Daljir Hospital
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Care, records and billing in one place.</h1>
          <p className="mt-4 max-w-md text-teal-100">
            Register patients, book appointments, manage doctors and pharmacy stock, and track every invoice.
          </p>
        </div>
        <p className="text-sm text-teal-200">© {new Date().getFullYear()} Daljir Hospital Management System</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <HeartPulse className="h-6 w-6 text-teal-600" /> Daljir Hospital
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">Sign in with your staff account.</p>
          <LoginForm initialMode={mode} />
        </div>
      </section>
    </main>
  );
}
