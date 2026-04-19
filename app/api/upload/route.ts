import { NextResponse } from "next/server";

import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { upsertTransactions, getScore } from "@/lib/store";
import { openClawChainedTrigger } from "@/lib/openclaw/trigger";
import { parseTransactionsCsv } from "@/lib/transactions/csv-parser";
import { aiClassifyMerchant } from "@/lib/transactions/ai-categorize";
import { resolveImpactColor } from "@/lib/transactions/categorization";
import type { Transaction } from "@/lib/types";

// ── PDF helpers ──────────────────────────────────────────────────────────────
const AU_DATE_PATTERN = /^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)(?:\s+\d{4})?)/i;
const AMOUNT_RE = /\$?([\d,]+\.\d{2})/g;

function extractAmounts(text: string): string[] {
  const amounts: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(AMOUNT_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    amounts.push(m[1].replaceAll(",", ""));
  }
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
    // Skip credit-only rows (income/refunds) — only keep rows with a debit amount
    const cols = row.split(",");
    const debit = cols[2]?.trim();
    const credit = cols[3]?.trim();
    if (!debit && credit) continue;
    csvRows.push(row);
  }
  return csvRows.length > 1 ? parseTransactionsCsv(csvRows.join("\n")) : parseTransactionsCsv(text);
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const authorization = await authorizeAgentScope("read:transactions");
  if (!authorization.ok) {
    return authorization.response;
  }

  let transactions: Transaction[] = [];
  let fileType = "";
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) throw new Error("No file uploaded");
    const filename = (file as File).name ?? "";

    if (filename.endsWith(".pdf")) {
      fileType = "pdf";
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      transactions = parsePdfText(result.text);
    } else if (filename.endsWith(".csv")) {
      fileType = "csv";
      const csvText = await file.text();
      transactions = parseTransactionsCsv(csvText);
    } else {
      throw new Error("Unsupported file type. Please upload a CSV or PDF.");
    }

    // Re-classify any "Other" transactions using OpenAI (batched, fire-and-forget if no key)
    const reclassified = await Promise.all(
      transactions.map(async (tx) => {
        if (tx.category !== "Other") return tx;
        const aiCategory = await aiClassifyMerchant(tx.merchant);
        if (aiCategory === "Other") return tx;
        return { ...tx, category: aiCategory, impact: resolveImpactColor(aiCategory, Math.abs(tx.amount)) };
      })
    );
    transactions = reclassified;

    const previousScore = getScore(authorization.context.userId)?.impactScore;
    upsertTransactions(authorization.context.userId, transactions);
    await openClawChainedTrigger(
      { sub: authorization.context.userId } as import("@auth0/nextjs-auth0/types").User,
      previousScore
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid upload payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({
    message: `Transactions uploaded successfully from ${fileType}`,
    count: transactions.length,
    transactions
  });
}
