export default function SetupPage() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Connect Supabase</h1>
      <p className="mt-3 text-slate-600">
        Set <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in{" "}
        <code className="rounded bg-slate-100 px-1">.env.local</code> (or in Vercel project settings), then restart.
      </p>
    </main>
  );
}
