import { NextResponse } from "next/server";

import { parseTransactionsCsv } from "@/lib/transactions/csv-parser";
import { aiClassifyMerchant } from "@/lib/transactions/ai-categorize";
import { resolveImpactColor } from "@/lib/transactions/categorization";
import { calculateImpactScore } from "@/lib/agent/scoring-engine";
import type { Transaction } from "@/lib/types";

// PDF parsing helpers (copied from upload/route.ts — no auth needed here)
const AU_DATE_PATTERN = /^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+\d{4})?)/i;
const AMOUNT_RE = /\$?([\d,]+\.\d{2})/g;

function extractAmounts(text: string): string[] {
  const amounts: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(AMOUNT_RE.source, "g");
  while ((m = re.exec(text)) !== null) amounts.push(m[1].replaceAll(",", ""));
  return amounts;
}

function cleanDescription(raw: string): string {
  return raw
    .replaceAll(/\$?[\d,]+\.\d{2}/g, "")
    .replaceAll(/\s*\(\s*/g, " ")
    .replaceAll(/\s+CR\b/gi, "")
    .replaceAll(/Card xx\d+/gi, "")
    .replace(/Value Date:.*$/i, "")
    .replaceAll(/\s{2,}/g, " ")
    .trim();
}

function parsePdfLine(trimmed: string): string | null {
  const dateExec = AU_DATE_PATTERN.exec(trimmed);
  if (!dateExec) return null;
  const date = dateExec[1].trim();
  const rest = trimmed.slice(date.length).trim();
  const amounts = extractAmounts(rest);
  const isCredit = /\$[\d,]+\.\d{2}\s+CR/.test(trimmed) && !/(\()/.test(rest);
  let debit = "", credit = "", balance = "";
  let description = rest;
  if (amounts.length >= 2) {
    balance = amounts.at(-1) ?? "";
    const secondLast = amounts.at(-2) ?? "";
    if (isCredit) credit = secondLast; else debit = secondLast;
    description = cleanDescription(rest);
  } else if (amounts.length === 1) {
    balance = amounts[0];
    description = rest.replaceAll(/\$?[\d,]+\.\d{2}/g, "").replaceAll(/\s{2,}/g, " ").trim();
  }
  const safeDesc = description.includes(",") ? `"${description}"` : description;
  return safeDesc ? `${date},${safeDesc},${debit},${credit},${balance}` : null;
}

function parsePdfText(text: string): Transaction[] {
  const lines = text.split(/\r?\n/);
  const csvRows: string[] = ["Date,Transaction,Debit,Credit,Balance"];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const row = parsePdfLine(trimmed);
    if (!row) continue;
    const cols = row.split(",");
    const debit = cols[2]?.trim();
    const credit = cols[3]?.trim();
    if (!debit && credit) continue;
    csvRows.push(row);
  }
  return csvRows.length > 1 ? parseTransactionsCsv(csvRows.join("\n")) : parseTransactionsCsv(text);
}

// Anonymous preview — no auth, no persistence
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const filename = (file as File).name ?? "";

    let transactions: Transaction[] = [];

    if (filename.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      transactions = parsePdfText(result.text);
    } else if (filename.endsWith(".csv")) {
      transactions = parseTransactionsCsv(await file.text());
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a CSV or PDF." }, { status: 400 });
    }

    // AI reclassify unknowns
    transactions = await Promise.all(
      transactions.map(async (tx) => {
        if (tx.category !== "Other") return tx;
        const aiCategory = await aiClassifyMerchant(tx.merchant);
        if (aiCategory === "Other") return tx;
        return { ...tx, category: aiCategory, impact: resolveImpactColor(aiCategory, Math.abs(tx.amount)) };
      })
    );

    // Compute score with a default anonymous user context
    const score = calculateImpactScore(transactions, {
      userId: "preview",
      scopes: [],
      preferences: { noCarOwnership: false, lowIncomeMode: false },
      pastInteractions: [],
      pastBehaviorSummaries: [],
    });

    // Category breakdown
    const breakdown: Record<string, { count: number; total: number }> = {};
    for (const tx of transactions) {
      const cat = tx.category ?? "Other";
      if (!breakdown[cat]) breakdown[cat] = { count: 0, total: 0 };
      breakdown[cat].count++;
      breakdown[cat].total += Math.abs(tx.amount);
    }

    return NextResponse.json({
      count: transactions.length,
      score,
      breakdown,
      transactions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
