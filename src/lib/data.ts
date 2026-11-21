import "server-only";
import type { Option, Resource } from "@/lib/resources";
import { createClient } from "@/lib/supabase/server";

/** Dropdown options for every relation field of a resource */
export async function loadRelationOptions(resource: Resource): Promise<Record<string, Option[]>> {
  const supabase = await createClient();
  const relations = resource.fields.filter((f) => f.type === "relation" && f.relation);
  const results = await Promise.all(
    relations.map(async (f) => {
      const { table, labelColumn } = f.relation!;
      const { data } = await supabase.from(table).select(`id, ${labelColumn}`).order(labelColumn).limit(1000);
      const rows = (data ?? []) as unknown as Record<string, string>[];
      return [f.name, rows.map((r) => ({ value: r.id, label: r[labelColumn] }))] as const;
    }),
  );
  return Object.fromEntries(results);
}

/** select() string that embeds the display column of every relation field */
export function selectWithRelations(resource: Resource) {
  const embeds = resource.fields
    .filter((f) => f.type === "relation" && f.relation)
    .map((f) => `${f.name}__rel:${f.relation!.table}!${f.name}(${f.relation!.labelColumn})`);
  return ["*", ...embeds].join(", ");
}
