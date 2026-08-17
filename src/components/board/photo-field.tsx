import { useRef, useState } from "react";
import { toast } from "sonner";
import { MonoMark } from "@/components/board/pieces";
import { Button } from "@/components/ui/button";
import { setFighterPhoto } from "@/lib/server/circuit";
import { useBoardMutation } from "@/lib/use-board";
import type { Fighter } from "@/lib/circuit/types";
import { compressPhoto } from "@/lib/photo";
import { cn } from "@/lib/utils";

export function PhotoField({
  fighter,
  slug,
  className,
  markClassName,
  compact,
  locked,
  pin,
  passcode,
}: {
  fighter: Fighter;
  slug: string;
  className?: string;
  markClassName?: string;
  compact?: boolean;
  locked?: boolean;
  pin?: string;
  passcode?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const save = useBoardMutation((d: Parameters<typeof setFighterPhoto>[0]["data"]) =>
    setFighterPhoto({ data: d }),
  );
  const canEdit = !locked && Boolean(pin || passcode);

  async function onFile(file: File | undefined) {
    if (!file || !canEdit) return;
    setBusy(true);
    try {
      const photoUrl = await compressPhoto(file);
      await save.mutateAsync({ slug, fighterId: fighter.id, photoUrl, pin, passcode });
      toast.success("Photo on the book.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that photo.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function clearPhoto() {
    if (!canEdit) return;
    setBusy(true);
    try {
      await save.mutateAsync({ slug, fighterId: fighter.id, photoUrl: "", pin, passcode });
      toast.success("Photo cleared.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not clear that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        className="relative shrink-0"
        onClick={() => canEdit && inputRef.current?.click()}
        aria-label={canEdit ? `Upload a photo for ${fighter.nickname}` : fighter.nickname}
        disabled={busy || save.isPending || !canEdit}
      >
        <MonoMark
          first={fighter.firstName}
          last={fighter.lastName}
          photo={fighter.photoUrl}
          className={markClassName}
        />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      {compact || !canEdit ? null : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || save.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {fighter.photoUrl ? "Change photo" : "Add photo"}
          </Button>
          {fighter.photoUrl ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy || save.isPending}
              onClick={() => void clearPhoto()}
            >
              Remove
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

