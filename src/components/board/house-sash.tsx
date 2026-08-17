import { cn } from "@/lib/utils";

export function HouseSash({ role, compact }: { role: "face" | "heel" | null; compact?: boolean }) {
  if (!role) return null;
  return (
    <span className={cn("house-sash", role === "face" ? "house-sash-face" : "house-sash-heel", compact && "house-sash-sm")}>
      {role === "face" ? "Babyface" : "Heel"}
    </span>
  );
}

export function FoundChrome({ compact }: { compact?: boolean }) {
  return (
    <>
      <span aria-hidden className="found-glow" />
      <span className={cn("found-sash", compact && "found-sash-sm")}>Lost & found</span>
    </>
  );
}

export function foundOn(plateFx: string | undefined, earned: boolean) {
  if (!earned) return false;
  return plateFx === "found";
}
