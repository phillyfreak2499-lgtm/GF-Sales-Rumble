import { DESK_PIN } from "./types";

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

export function deskUnlocked(pin = readDeskPin()) {
  return pin.trim().toLowerCase() === DESK_PIN;
}
