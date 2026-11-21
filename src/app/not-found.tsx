import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[60vh] place-items-center p-8 text-center">
      <div>
        <p className="text-sm font-semibold text-teal-700">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-teal-700 hover:underline">Go to dashboard</Link>
      </div>
    </main>
  );
}
