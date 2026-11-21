import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ResourceForm } from "@/components/resource-form";
import { loadRelationOptions } from "@/lib/data";
import { formatDateTime, toDateTimeInput } from "@/lib/format";
import { getResource } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";
import { saveRecord } from "../actions";

export async function generateMetadata({ params }: PageProps<"/[resource]/[id]">): Promise<Metadata> {
  const { resource } = await params;
  const r = getResource(resource);
  return { title: r ? `Edit ${r.singular.toLowerCase()}` : "Not found" };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRecordPage({ params }: PageProps<"/[resource]/[id]">) {
  const { resource: slug, id } = await params;
  const resource = getResource(slug);
  if (!resource || !UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: record }, relationOptions] = await Promise.all([
    supabase.from(resource.table).select("*").eq("id", id).maybeSingle(),
    loadRelationOptions(resource),
  ]);
  if (!record) notFound();

  const values: Record<string, string | boolean> = {};
  for (const f of resource.fields) {
    const v = record[f.name];
    if (f.type === "boolean") values[f.name] = Boolean(v);
    else if (f.type === "datetime") values[f.name] = toDateTimeInput(v);
    else values[f.name] = v === null || v === undefined ? "" : String(v);
  }

  const heading = String(record[resource.titleColumn] ?? resource.singular);
  const generated = resource.fields.filter((f) => f.readOnly && record[f.name]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to {resource.title.toLowerCase()}
      </Link>
      <PageHeader
        title={heading}
        description={[
          ...generated.map((f) => `${f.label} ${record[f.name]}`),
          `Last updated ${formatDateTime(record.updated_at)}`,
        ].join(" · ")}
      />
      <ResourceForm
        fields={resource.fields}
        values={values}
        relationOptions={relationOptions}
        action={saveRecord.bind(null, slug, id)}
        cancelHref={`/${slug}`}
        submitLabel="Save changes"
      />
    </div>
  );
}
