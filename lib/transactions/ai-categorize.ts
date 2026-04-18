import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { TransactionCategory } from "@/lib/types";

const VALID_CATEGORIES: TransactionCategory[] = [
  "Fast Fashion",
  "Food Delivery",
  "Grocery",
  "Hygiene Products",
  "Transport",
  "Electronics",
  "Other",
];

const SYSTEM_PROMPT = `You classify merchant names into exactly one of these categories: Fast Fashion, Food Delivery, Grocery, Hygiene Products, Transport, Electronics, Other.
Reply with ONLY the category name, nothing else.`;

// In-process cache — same merchant won't be re-classified on every upload
const cache = new Map<string, TransactionCategory>();

let _model: BaseChatModel | null | undefined = undefined; // undefined = not yet resolved

async function getModel(): Promise<BaseChatModel | null> {
  if (_model !== undefined) return _model;

  if (process.env.OPENAI_API_KEY) {
    const { ChatOpenAI } = await import("@langchain/openai");
    _model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0, maxTokens: 10 });
    console.log("[ai-categorize] Using OpenAI gpt-4o-mini");
    return _model;
  }

  if (process.env.GEMINI_API_KEY) {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    _model = new ChatGoogleGenerativeAI({ model: "gemini-1.5-flash", temperature: 0, maxOutputTokens: 10, apiKey: process.env.GEMINI_API_KEY });
    console.log("[ai-categorize] Using Gemini gemini-1.5-flash");
    return _model;
  }

  console.warn("[ai-categorize] No AI key found (OPENAI_API_KEY or GEMINI_API_KEY). Falling back to rules only.");
  _model = null;
  return null;
}

export async function aiClassifyMerchant(merchant: string): Promise<TransactionCategory> {
  const key = merchant.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  const model = await getModel();
  if (!model) return "Other";

  try {
    const response = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(`Merchant: "${merchant}"`),
    ]);

    const raw = (typeof response.content === "string" ? response.content : "").trim();
    const category = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === raw.toLowerCase()
    ) ?? "Other";

    cache.set(key, category);
    return category;
  } catch {
    return "Other";
  }
}
