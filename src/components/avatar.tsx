/* eslint-disable @next/next/no-img-element */
const palette = [
  "bg-teal-100 text-teal-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
];

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
}) {
  const initials = name
    .replace(/^Dr\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const tone = palette[[...name].reduce((h, c) => h + c.charCodeAt(0), 0) % palette.length];

  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} shrink-0 rounded-full object-cover ring-2 ring-white`} />;
  }
  return (
    <span className={`${sizes[size]} ${tone} grid shrink-0 place-items-center rounded-full font-semibold ring-2 ring-white`}>
      {initials || "?"}
    </span>
  );
}
