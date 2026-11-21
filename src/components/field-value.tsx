import { Badge } from "@/components/badge";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import type { Field } from "@/lib/resources";

export type Row = Record<string, unknown> & { id: string };

export function Cell({ field, row, full = false }: { field: Field; row: Row; full?: boolean }) {
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
      return full ? (
        <span className="whitespace-pre-line">{String(value)}</span>
      ) : (
        <span className="line-clamp-1 max-w-xs">{String(value)}</span>
      );
    default:
      return <>{String(value)}</>;
  }
}

