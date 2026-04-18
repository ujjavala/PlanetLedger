import type { ImpactColor, TransactionCategory } from "@/lib/types";

function containsAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function resolveCategory(rawCategory: string, merchantName: string, amount: number): TransactionCategory {
  const normalizedCategory = rawCategory.toLowerCase().trim();
  const m = merchantName.toLowerCase();

  // Fast Fashion — AU & global vendors (checked FIRST to avoid transport regex stealing "clothing" merchants)
  if (
    containsAny(normalizedCategory, ["fashion", "clothing", "apparel", "wear"]) ||
    /zara|h&m|shein|asos|city chic|skechers|puma|tk maxx|kmart|david jones|myer|cotton on|target|uniqlo|factorie|connor|connor clothing|glue store|general pants|industrie|marcs|saba|country road|witchery|jeanswest|rivers|noni b|millers|crossroads|autograph|rockmans|beme|katies|suzanne grae|dotti|supre|dangerfield|glassons|rubi|colorado|wittner|novo|styletread|hush puppies|payless|diana ferrari|athlete's foot|rebel sport|rebel|platypus|converse|vans|nike|adidas|levi|gap|zara|mango/.test(m)
  ) {
    return "Fast Fashion";
  }

  // Food Delivery & dining
  if (
    containsAny(normalizedCategory, ["food", "dining", "restaurant", "cafe"]) ||
    /uber eats|deliveroo|doordash|menulog|hungry jack|mcdonald|kfc|subway|diner|restaurant|cafe|burger|pizza|domino|nando|grill|sushi|thai|chinese|indian|kebab|bakery|bake|pancake|waffle/.test(m)
  ) {
    return "Food Delivery";
  }

  // Grocery — AU chains
  if (
    containsAny(normalizedCategory, ["grocery", "supermarket"]) ||
    /woolworths|coles|iga|aldi|supa m|ww metro|harris farm|foodworks|franklins|costco|spudshed/.test(m)
  ) {
    return "Grocery";
  }

  // Hygiene / Health / Pharmacy
  if (
    containsAny(normalizedCategory, ["hygiene", "pharmacy", "health", "chemist"]) ||
    /chemist warehouse|chemistwarehouse|priceline|shaver shop|sephora|beauty|cosmetic|medibank|nib |bupa|hif |hif of aus|meds|medical|doctor|dental|physio|optical|specsavers|opsm/.test(m)
  ) {
    return "Hygiene Products";
  }

  // Transport
  if (
    containsAny(normalizedCategory, ["transport", "transit", "travel"]) ||
    /\bopal\b|transportfornsw|skybus|myki|tram|metro rail|train station|airport (link|shuttle|bus)|didichu|didi mobi|lyft|\btaxi\b|7-eleven|7eleven|bp |shell |caltex|ampol|fuel|petrol/.test(m) ||
    (/\buber\b/.test(m) && !/uber eats/.test(m))
  ) {
    return "Transport";
  }

  // Electronics / Online
  if (
    containsAny(normalizedCategory, ["electronic", "tech", "computer"]) ||
    /apple store|apple\.com|jb hi.fi|harvey norman|amazon|officeworks|microsoft|google play|app store|steam|adobe|spotify|netflix|stan |binge |foxtel/.test(m)
  ) {
    return "Electronics";
  }

  // Home / Lifestyle / Other known
  if (/ikea|rbgdt|calyx|snap fitness|snapolympic|gym|pilates|fitness|ozia tours|7-eleven|7eleven/.test(m)) {
    return "Other";
  }

  // Income / credits — not a spend
  if (/direct credit|fabric payroll|fast transfer|payroll/.test(m)) {
    return "Other";
  }

  // ── Keyword fallback for unrecognised merchants ──────────────────────────
  // Infer from words in the merchant name itself

  if (/cloth|fashion|wear|apparel|boutique|style|dress|shirt|shoe|boot|jean|suit|skirt|jacket|coat|hat|scarf|accessori/.test(m)) {
    return "Fast Fashion";
  }

  if (/cafe|coffee|espresso|restaurant|bistro|dining|eatery|grill|pizza|burger|sushi|noodle|dumpli|kebab|bakery|pastry|brunch|lunch|dinner|takeaway|takeout/.test(m)) {
    return "Food Delivery";
  }

  if (/supermarket|grocer|market|fresh|fruit|veg|deli|butcher|seafood|organic|health food/.test(m)) {
    return "Grocery";
  }

  if (/chemist|pharmacy|health|medical|dental|optical|physio|clinic|hospital|medic|drug|vitamin|supplement|beauty|skin|hair|nail|spa/.test(m)) {
    return "Hygiene Products";
  }

  if (/taxi|cab|ride|shuttle|coach|bus|train|rail|ferry|tram|parking|fuel|petrol|service station|car wash|auto|motor/.test(m)) {
    return "Transport";
  }

  if (/tech|electro|comput|phone|mobile|tablet|laptop|camera|gadget|software|digital|cyber|it |i\.t\.|wireless|telco|telecom/.test(m)) {
    return "Electronics";
  }

  return "Other";
}

export function resolveImpactColor(category: TransactionCategory, amount: number): ImpactColor {
  if (category === "Fast Fashion" || category === "Hygiene Products" || category === "Electronics") {
    return "RED";
  }

  if (category === "Food Delivery") {
    return "YELLOW";
  }

  if (category === "Grocery") {
    return amount > 120 ? "YELLOW" : "GREEN";
  }

  if (category === "Transport") {
    return amount > 60 ? "YELLOW" : "GREEN";
  }

  return amount > 100 ? "YELLOW" : "GREEN";
}
