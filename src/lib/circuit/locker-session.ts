const KEY = "cogs-locker-pass";

export function readLockerPass() {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeLockerPass(code: string) {
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    /* private mode */
  }
}

export function clearLockerPass() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
