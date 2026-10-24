import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export type Categorised = { item_name: string | null; category: string | null; sub_category: string | null };

// One Claude call for all distinct merchant names, using the existing rows as examples.
export async function suggestCategories(rows: Categorised[], examples: Categorised[]) {
  const names = [...new Set(rows.map((r) => r.item_name).filter((n): n is string => !!n))];
  if (!names.length) return;

  const labelled = examples.filter((e) => e.category);
  const categories = [...new Set(labelled.map((e) => e.category!))];
  const pairs = [...new Set(labelled.map((e) => `${e.category} / ${e.sub_category ?? ""}`))];

  const message = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 16000,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string", enum: categories },
                  sub_category: { type: "string" },
                },
                required: ["name", "category", "sub_category"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
    system: `You categorise credit card purchases for a person living in Japan. Merchant names come from a Rakuten Card statement and may be katakana or abbreviated.

Use one of the categories given. Reuse an existing sub-category when one fits; otherwise make a short English one in the same style. Living (生活費) is for recurring essentials such as utilities, rent, phone and internet; Variable (変動費) is everyday discretionary spending; Special (特別出費・年数回) is for large or rare purchases.

Existing category / sub-category pairs:
${pairs.join("\n")}

Examples from my data (JSON):
${JSON.stringify(labelled.slice(0, 100).map((e) => [e.item_name, e.category, e.sub_category]))}`,
    messages: [{ role: "user", content: `Categorise each of these merchants, returning the name exactly as given:\n${names.join("\n")}` }],
  });

  const text = message.content.find((b) => b.type === "text")?.text;
  if (message.stop_reason !== "end_turn" || !text) return; // leave them uncategorised for manual review
  const byName = new Map<string, { category: string; sub_category: string }>(
    (JSON.parse(text).items as { name: string; category: string; sub_category: string }[]).map((i) => [i.name, i]),
  );
  for (const r of rows) {
    const s = r.item_name ? byName.get(r.item_name) : undefined;
    if (s) Object.assign(r, { category: s.category, sub_category: s.sub_category });
  }
}
