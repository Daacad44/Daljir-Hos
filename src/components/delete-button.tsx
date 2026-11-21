"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import type { FormState } from "@/app/(app)/[resource]/actions";

export function DeleteButton({
  action,
  label,
  redirectTo,
  variant = "icon",
}: {
  action: () => Promise<FormState>;
  label: string;
  redirectTo?: string;
  variant?: "icon" | "button";
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={
          variant === "button"
            ? "inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
            : "rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        }
        aria-label={`Delete ${label}`}
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
        {variant === "button" && "Delete"}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs">
      {error ? (
        <span className="text-rose-600">{error}</span>
      ) : (
        <span className="text-slate-600">Delete?</span>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await action();
            if (res.error) setError(res.error);
            else if (redirectTo) router.push(redirectTo);
            else setConfirming(false);
          })
        }
        className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />} Yes
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setError(undefined);
        }}
        className="rounded-md px-2 py-1 font-medium text-slate-600 hover:bg-slate-100"
      >
        No
      </button>
    </span>
  );
}
