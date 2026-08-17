import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nid(prefix: string) {
  const raw = crypto.randomUUID().replace(/-/g, "").slice(0, 14);
  return `${prefix}_${raw}`;
}

export function claimCodeFrom(nickname: string, salt: string) {
  const base = nickname
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(4, "X");
  const tail = salt.replace(/[^A-Z0-9]/gi, "").slice(-2).toUpperCase() || "01";
  return `${base}${tail}`;
}

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function displayName(first: string, last: string, nickname: string) {
  return nickname ? `${first} “${nickname}” ${last}` : `${first} ${last}`;
}
