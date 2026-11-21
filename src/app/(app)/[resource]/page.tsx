import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { Badge } from "@/components/badge";
import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/page-header";
import { selectWithRelations } from "@/lib/data";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { getResource, type Field } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";
import { deleteRecord } from "./actions";

const PAGE_SIZE = 20;

export async function generateMetadata({ params }: PageProps<"/[resource]">): Promise<Metadata> {
  const { resource } = await params;
  return { title: getResource(resource)?.title ?? "Not found" };
}

type Row = Record<string, unknown> & { id: string };

function Cell({ field, row }: { field: Field; row: Row }) {
  const value = row[field.name];
  if (field.type === "relation") {
    const rel = row[`${field.name}__rel`] as Record<string, string> | null;
    return <>{rel?.[field.relation!.labelColumn] ?? "—"}</>;
  }
  if (value === null || value === undefined || value === "") return <span className="text-slate-400">—</span>;
  switch (field.type) {
    case "money":
      return <span className="tabular-nums">{formatMoney(value as number)}</span>;
    case "date":
      return <>{formatDate(value as string)}</>;
    case "datetime":
      return <>{formatDateTime(value as string)}</>;
    case "boolean":
      return <Badge value={value ? "active" : "inactive"} label={value ? "Yes" : "No"} />;
    case "select":
      if (field.name === "status" || field.name === "gender") {
        return <Badge value={String(value)} label={field.options?.find((o) => o.value === value)?.label} />;
      }
      return <>{field.options?.find((o) => o.value === value)?.label ?? String(value)}</>;
    case "number":
      if (field.name === "stock_quantity" && typeof row.reorder_level === "number" && (value as number) <= row.reorder_level) {
        return <Badge value={(value as number) === 0 ? "unpaid" : "low"} label={String(value)} />;
      }
      return <span className="tabular-nums">{String(value)}</span>;
    case "textarea":
      return <span className="line-clamp-1 max-w-xs">{String(value)}</span>;
    default:
      return <>{String(value)}</>;
  }
}

export default async function ResourceListPage({ params, searchParams }: PageProps<"/[resource]">) {
  const { resource: slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const saved = sp.saved === "1";

  const supabase = await createClient();
  let query = supabase
    .from(resource.table)
    .select(selectWithRelations(resource), { count: "exact" })
    .order(resource.orderBy.column, { ascending: resource.orderBy.ascending })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) {
    // Strip characters that have meaning in PostgREST filter syntax
    const safe = q.replace(/[%,()*\\]/g, " ");
    query = query.or(resource.searchColumns.map((c) => `${c}.ilike.%${safe}%`).join(","));
  }

  const { data, count, error } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const columns = resource.fields.filter((f) => f.list);
  const pageHref = (p: number) => `/${slug}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader
        title={resource.title}
        description={resource.description}
        actions={
          <Link
            href={`/${slug}/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" /> New {resource.singular.toLowerCase()}
          </Link>
        }
      />

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {resource.singular} saved.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <form className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder={`Search ${resource.title.toLowerCase()}…`}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </form>
          <p className="text-sm text-slate-500">
            {total} {total === 1 ? "record" : "records"}
          </p>
        </div>

        {error ? (
          <p className="px-5 py-10 text-center text-sm text-rose-600">Could not load records: {error.message}</p>
        ) : rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-slate-500">{q ? "No records match your search." : `No ${resource.title.toLowerCase()} yet.`}</p>
            {!q && (
              <Link href={`/${slug}/new`} className="mt-3 inline-block text-sm font-medium text-teal-700 hover:underline">
                Add the first {resource.singular.toLowerCase()}
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((c) => (
                    <th key={c.name} className="whitespace-nowrap px-4 py-3">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    {columns.map((c, i) => (
                      <td key={c.name} className={`whitespace-nowrap px-4 py-3 ${i === 0 ? "font-medium text-slate-900" : "text-slate-600"}`}>
                        {i === 0 ? (
                          <Link href={`/${slug}/${row.id}`} className="hover:text-teal-700 hover:underline">
                            <Cell field={c} row={row} />
                          </Link>
                        ) : (
                          <Cell field={c} row={row} />
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/${slug}/${row.id}`}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <DeleteButton action={deleteRecord.bind(null, slug, row.id)} label={resource.singular} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
            <span className="text-slate-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              {page < pages && (
                <Link href={pageHref(page + 1)} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
