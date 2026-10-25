// One colour per top category, used in every chart, dot and tag (docs/ui.md, Shared patterns).
// The values are CSS variables in app/globals.css, with their own validated steps for dark mode.
// Matched on the English word, since the stored names carry Japanese too, e.g. "Living (生活費)".
const colors: [prefix: string, color: string][] = [
  ["Living", "var(--cat-living)"],
  ["Variable", "var(--cat-variable)"],
  ["Special", "var(--cat-special)"],
];

export function categoryColor(category: string | null | undefined) {
  return colors.find(([p]) => category?.startsWith(p))?.[1] ?? "var(--cat-none)";
}
