import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { question } = await request.json();

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  let csvContent: string;
  try {
    csvContent = readFileSync(join(process.cwd(), "data", "expenses.csv"), "utf-8");
  } catch {
    return NextResponse.json({ error: "Could not read expenses.csv" }, { status: 500 });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You are a helpful personal finance assistant. Answer questions about the user's expenses using the CSV data below.

The data uses Japanese Yen (¥). Dates are in YYYY/M/D format. Key columns: Date, Item Name, Category, Sub-Category, Payment Method, Amount, Notes, Month-Year.

When calculating totals, strip the ¥ sign and commas from amounts. Be concise and specific — include totals, breakdowns, or counts where relevant.

Expenses CSV:
${csvContent}`,
    messages: [{ role: "user", content: question }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ answer: text });
}
