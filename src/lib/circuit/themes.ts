export const SITE_THEMES = [
  { id: "house", name: "House burgundy", blurb: "The original room. Wine and gold." },
  { id: "midnight", name: "Midnight card", blurb: "Navy hall. Ice rope." },
  { id: "garden", name: "Garden sweep", blurb: "Dark green. Looks like a week of greens." },
  { id: "neon", name: "Neon Friday", blurb: "Black lights. Pink and cyan." },
  { id: "gold", name: "Gold rush", blurb: "Heavy metal. Title-night lighting." },
  { id: "ice", name: "Ice house", blurb: "Cool slate. Steel and bone." },
] as const;

export type SiteTheme = (typeof SITE_THEMES)[number]["id"];

export function isSiteTheme(v: string): v is SiteTheme {
  return SITE_THEMES.some((t) => t.id === v);
}
