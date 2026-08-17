import { useLayoutEffect } from "react";
import { useBoard } from "@/lib/use-board";

export function ThemeMount() {
  const { data } = useBoard();
  const theme = data?.circuit.theme || "house";
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme === "house" ? "" : theme;
    if (!theme || theme === "house") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);
  return null;
}
