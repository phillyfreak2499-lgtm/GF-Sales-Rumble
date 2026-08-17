import { useEffect, useState } from "react";
import { ANNOUNCE_BY_ID, isAnnounceStyle, type AnnounceStyle } from "@/lib/circuit/announce";

const KEY = "gazette-announce-style";

export function useAnnounceStyle() {
  const [style, setStyle] = useState<AnnounceStyle>("formal");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) ?? "";
      if (isAnnounceStyle(saved)) setStyle(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function choose(next: AnnounceStyle) {
    setStyle(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }

  return { style, choose, meta: ANNOUNCE_BY_ID[style] };
}
