import { MessageCircle } from "lucide-react";

export function WhatsAppButton({
  href,
  label = "Send on WhatsApp",
  size = "md",
}: {
  href: string | null;
  label?: string;
  size?: "sm" | "md";
}) {
  const cls =
    size === "sm"
      ? "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
      : "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm";
  if (!href) {
    return (
      <span className={`${cls} cursor-not-allowed bg-slate-100 text-slate-400`} title="Add a valid phone number first">
        <MessageCircle className="h-4 w-4" /> {label}
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} bg-[#25D366] text-white hover:bg-[#1ebe5a]`}>
      <MessageCircle className="h-4 w-4" /> {label}
    </a>
  );
}
