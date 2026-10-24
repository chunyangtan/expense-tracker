import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { question } = await request.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("date, item_name, category, sub_category, payment_method, amount, currency, notes")
    .neq("kind", "transfer")
    .order("date");
  if (error) {
    return NextResponse.json({ error: "Could not load expenses" }, { status: 500 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 16000,
    system: `You are a helpful personal finance assistant. Answer questions about the user's expenses using the data below.

Each expense has a date (YYYY-MM-DD), item_name, category, sub_category, payment_method, amount and currency (JPY or MYR). Never add amounts in different currencies together.

Be concise and specific — include totals, breakdowns, or counts where relevant.

Expenses (JSON):
${JSON.stringify(expenses)}`,
    messages: [{ role: "user", content: question }],
  });

  const text = message.content.find((block) => block.type === "text")?.text ?? "";
  return NextResponse.json({ answer: text });
}
