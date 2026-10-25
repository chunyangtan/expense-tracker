// One colour per top category, used in every chart, dot and tag (docs/ui.md, Shared patterns).
// Matched on the English word, since the stored names carry Japanese too, e.g. "Living (生活費)".
const colors: [prefix: string, color: string][] = [
  ["Living", "#1F66C1"],
  ["Variable", "#E08A2E"],
  ["Special", "#7B57C2"],
];

export function categoryColor(category: string | null | undefined) {
  return colors.find(([p]) => category?.startsWith(p))?.[1] ?? "#A3A5AA";
}
