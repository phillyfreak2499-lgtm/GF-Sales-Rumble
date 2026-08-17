import { STORES } from "@/lib/circuit/stores";
import { cn } from "@/lib/utils";

export function StoreSelect({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (name: string) => void;
  id?: string;
  className?: string;
}) {
  const selected =
    STORES.find((s) => s.name === value)?.name ?? STORES.find((s) => s.slug === value)?.name ?? "";
  return (
    <select
      id={id}
      className={cn(
        "flex h-11 w-full rounded-sm border border-line bg-raised px-3 text-sm text-fg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        className,
      )}
      value={selected}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Pick your locker room</option>
      {STORES.map((s) => (
        <option key={s.slug} value={s.name}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
