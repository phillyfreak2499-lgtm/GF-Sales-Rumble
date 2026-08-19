import { verifyDeskPin } from "@/lib/server/circuit";

const KEY = "clinch-desk-pin";

export function readDeskPin(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeDeskPin(pin: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, pin);
  } catch {
    /* ignore */
  }
}

export function clearDeskPin() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// The real PIN never reaches the client — this asks the server to check the
// entered guess instead of comparing against a bundled constant.
export async function deskUnlocked(pin = readDeskPin()): Promise<boolean> {
  const trimmed = pin.trim();
  if (!trimmed) return false;
  try {
    return await verifyDeskPin({ data: { pin: trimmed } });
  } catch {
    return false;
  }
}
