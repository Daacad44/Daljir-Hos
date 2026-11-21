"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HeartPulse, LogOut, Menu, X } from "lucide-react";
import { icons } from "./icons";

type NavItem = { href: string; label: string; icon: string };

export function Sidebar({
  items,
  user,
  signOut,
}: {
  items: NavItem[];
  user: { fullName: string; role: string };
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-teal-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const panel = (
    <div className="flex h-full flex-col gap-6 bg-white py-5">
      <div className="flex items-center gap-2 px-6">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-600 text-white">
          <HeartPulse className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">Daljir Hospital</p>
          <p className="text-xs text-slate-500">Management System</p>
        </div>
      </div>
      {nav}
      <div className="mx-3 rounded-lg border border-slate-200 p-3">
        <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
        <p className="text-xs capitalize text-slate-500">{user.role}</p>
        <form action={signOut}>
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 lg:block">{panel}</aside>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <HeartPulse className="h-5 w-5 text-teal-600" /> Daljir Hospital
        </span>
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-slate-100">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-xl">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-md p-1.5 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}
