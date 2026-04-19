import { openClawChainedTrigger } from "@/lib/openclaw/trigger";
import { NextResponse } from "next/server";
import { authorizeAgentScope } from "@/lib/auth/agent-authorization";
import { upsertTransactions, getScore } from "@/lib/store";
import { parseTransactionsCsv } from "@/lib/transactions/csv-parser";



async function extractTextFromPdf(request: Request): Promise<string> {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) throw new Error("No PDF file uploaded");
  const buffer = Buffer.from(await file.arrayBuffer());
  const pdfParse = (await import("pdf-parse")) as any;
  const data = await pdfParse.default ? pdfParse.default(buffer) : pdfParse(buffer);
  return data.text;
}

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

  const isCredit = /\$[\d,]+\.\d{2}\s+CR/.test(trimmed) && !/\(/.test(rest);
  let debit = "";
  let credit = "";
  let balance = "";
  let description = rest;

  if (amounts.length >= 2) {
    balance = amounts.at(-1) ?? "";
    const secondLast = amounts.at(-2) ?? "";
    if (isCredit) credit = secondLast;
    else debit = secondLast;
    description = cleanDescription(rest);
  } else if (amounts.length === 1) {
    balance = amounts[0];
    description = rest.replaceAll(/\$?[\d,]+\.\d{2}/g, "").replaceAll(/\s{2,}/g, " ").trim();
  }

  const safeDesc = description.includes(",") ? `"${description}"` : description;
  return safeDesc ? `${date},${safeDesc},${debit},${credit},${balance}` : null;
}

/**
 * Parses Australian transaction summary text (from PDF) into CSV rows.
 * Handles: DD Mon [YYYY] | Description | Debit | Credit | Balance
 */
function extractTransactionsFromText(text: string) {
  const lines = text.split(/\r?\n/);
  const csvRows: string[] = ["Date,Transaction,Debit,Credit,Balance"];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const row = parsePdfLine(trimmed);
    if (row) csvRows.push(row);
  }

  return csvRows.length > 1
    ? parseTransactionsCsv(csvRows.join("\n"))
    : parseTransactionsCsv(text);
}

export async function POST(request: Request) {
  const authorization = await authorizeAgentScope("read:transactions");
  if (!authorization.ok) {
    return authorization.response;
  }

  let transactions = [];
  let fileType = "";
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) throw new Error("No file uploaded");
    const filename = file.name || "";
    if (filename.endsWith(".pdf")) {
      fileType = "pdf";
      const text = await extractTextFromPdf(request);
      transactions = extractTransactionsFromText(text);
    } else if (filename.endsWith(".csv")) {
      fileType = "csv";
      const csvText = await file.text();
      transactions = parseTransactionsCsv(csvText);
    } else {
      throw new Error("Unsupported file type. Upload CSV or PDF.");
    }
    const previousScore = getScore(authorization.context.userId)?.impactScore;
    upsertTransactions(authorization.context.userId, transactions);
    // OpenClaw: chained multi-event pipeline after upload
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
