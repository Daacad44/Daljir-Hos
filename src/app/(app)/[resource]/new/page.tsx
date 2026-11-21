import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ResourceForm } from "@/components/resource-form";
import { loadRelationOptions } from "@/lib/data";
import { todayRange } from "@/lib/format";
import { getResource } from "@/lib/resources";
import { saveRecord } from "../actions";

export async function generateMetadata({ params }: PageProps<"/[resource]/new">): Promise<Metadata> {
  const { resource } = await params;
  const r = getResource(resource);
  return { title: r ? `New ${r.singular.toLowerCase()}` : "Not found" };
}

export default async function NewRecordPage({ params }: PageProps<"/[resource]/new">) {
  const { resource: slug } = await params;
  const resource = getResource(slug);
  if (!resource) notFound();

  const relationOptions = await loadRelationOptions(resource);

  // Sensible defaults for a new record
  const values: Record<string, string | boolean> = {};
  for (const f of resource.fields) {
    if (f.name === "status" && f.options) values.status = f.options[0].value;
    if (f.name === "issued_on") values.issued_on = todayRange().date;
    if (f.type === "boolean") values[f.name] = true;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/${slug}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to {resource.title.toLowerCase()}
      </Link>
      <PageHeader title={`New ${resource.singular.toLowerCase()}`} description={resource.description} />
      <ResourceForm
        fields={resource.fields}
        values={values}
        relationOptions={relationOptions}
        action={saveRecord.bind(null, slug, null)}
        cancelHref={`/${slug}`}
        submitLabel={`Create ${resource.singular.toLowerCase()}`}
      />
    </div>
  );
}
