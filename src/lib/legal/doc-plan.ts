/**
 * Pre-drafting classifier + checklist planner for free-form ("custom" type)
 * document generation. Unlike the 12 fixed doc types, a custom request's
 * document type isn't known ahead of time, so mandatory-clause coverage
 * can't be baked into a per-type QUESTION_SCHEMAS entry — this cheap model
 * call identifies the document type and enumerates the structural elements
 * Georgian law requires for it, which the drafting pass is then told to
 * satisfy. Also gates out requests that aren't actually a document at all.
 *
 * Degrades gracefully on any classifier failure (no key, timeout, bad JSON):
 * fails open (isDocument: true, empty checklist) so a transient hiccup on
 * this step never blocks a paying user's generation — it just skips the
 * extra checklist safeguard for that one request.
 */
import { callOpenRouter, FAST_MODEL, type ChatMessage } from "./openrouter";
import { TEMPLATE_TYPES } from "./templates";
import { DOC_TYPE_LABELS } from "./doc-type-labels";
import type { Locale } from "../i18n/config";

export type DocPlan = {
  isDocument: boolean;
  docTypeKa: string;
  docTypeEn: string;
  checklist: string[];
  /** Key of an existing static template (see templates.ts) that already
   * covers this exact request, or "" if none does — see the template-check
   * alert in the /api/generate route, which skips drafting and points the
   * user at /templates instead unless they've already confirmed. */
  matchedTemplateType: string;
  costUsd: number;
};

const TEMPLATE_LIST_KA = TEMPLATE_TYPES.map((t) => `${t}: ${DOC_TYPE_LABELS[t].label}`).join("\n");
const TEMPLATE_LIST_EN = TEMPLATE_TYPES.map((t) => `${t}: ${DOC_TYPE_LABELS[t].labelEn}`).join("\n");

const PLAN_SYSTEM_KA = `შენ ხარ ქართული იურიდიული დოკუმენტების კლასიფიკატორი და გეგმის შემდგენელი.
მომხმარებელი აღწერს, რა დოკუმენტი სჭირდება. შენი ამოცანაა:
1. განსაზღვრე, არის თუ არა მოთხოვნა რეალურად კონკრეტული იურიდიული/ოფიციალური დოკუმენტის (ხელშეკრულება, განცხადება, თანხმობა, აქტი, შეტყობინება, პრეტენზია, მინდობილობა და ა.შ.) შედგენის მოთხოვნა. თუ მოთხოვნა ამას არ ეხება (მაგ. ესეს, ლექსის, კოდის დაწერა, ან სხვა არარელევანტური თემა) — ეს არ არის დოკუმენტი.
2. თუ დოკუმენტია: მიუთითე მისი მოკლე დასახელება ქართულად და ინგლისურად, და ჩამოთვალე 4-10 პუნქტიანი checklist — კონკრეტული სავალდებულო სტრუქტურული ელემენტები და პირობები, რომლებსაც ეს ზუსტი დოკუმენტის ტიპი საქართველოს კანონმდებლობით მოითხოვს (მაგ. მხარეთა რეკვიზიტები, საგანი, ვადა, ფასი/თანხა და გადახდის პირობები, შეწყვეტის/დარღვევის პირობები, ხელმოწერა და თარიღი, იურისდიქცია, ან ამ ტიპისთვის სპეციფიკური სხვა სავალდებულო ელემენტი).
3. საიტზე უკვე არსებობს მზა, სტანდარტული შაბლონები შემდეგი დოკუმენტების ტიპებისთვის:
${TEMPLATE_LIST_KA}
შეამოწმე, ეთანხმება თუ არა მომხმარებლის მოთხოვნა ერთ-ერთ ამ სტანდარტულ ტიპს არსებითად (არა მხოლოდ ზერელედ მსგავსი) — თუ ეთანხმება, დააბრუნე ის ტიპის გასაღები (key) ზუსტად ისე, როგორც ზემოთ სიაშია, ველში "matchedTemplateType". თუ მოთხოვნა არსებითად განსხვავებულია ან სპეციფიკურია ისე, რომ ზემოთ ჩამოთვლილი ტიპებიდან არცერთს ნამდვილად არ ეთანხმება — დააბრუნე ცარიელი სტრიქონი.
დააბრუნე მხოლოდ JSON, ზუსტად ამ ფორმატით, დამატებითი ტექსტის გარეშე:
{"isDocument": true|false, "docTypeKa": "...", "docTypeEn": "...", "checklist": ["...", "..."], "matchedTemplateType": "..."}
თუ isDocument არის false, docTypeKa/docTypeEn/checklist/matchedTemplateType დატოვე ცარიელი.`;

const PLAN_SYSTEM_EN = `You are a classifier and checklist planner for Georgian legal documents.
The user describes a document they need. Your job:
1. Decide whether the request is genuinely a request to draft a specific legal/official document (contract, application, consent, act, notice, claim, power of attorney, etc.). If it isn't (e.g. writing an essay, a poem, code, or any other unrelated topic) — this is not a document.
2. If it is a document: give its short name in Georgian and English, and list a 4-10 item checklist — the concrete mandatory structural elements and terms Georgian law requires for this exact document type (e.g. party identifiers, subject matter, term/duration, price/amount and payment terms, termination/breach conditions, signature and date, jurisdiction, or any other element specific to this type).
3. The site already offers ready-made, standard templates for the following document types:
${TEMPLATE_LIST_EN}
Check whether the user's request substantively matches one of these standard types (not just superficially similar) — if it does, return that type's key exactly as listed above, in the field "matchedTemplateType". If the request is substantively different or specific enough that none of the listed types genuinely match — return an empty string.
Return only JSON, in exactly this format, with no extra text:
{"isDocument": true|false, "docTypeKa": "...", "docTypeEn": "...", "checklist": ["...", "..."], "matchedTemplateType": "..."}
If isDocument is false, leave docTypeKa/docTypeEn/checklist/matchedTemplateType empty.`;

function parsePlan(raw: string): Omit<DocPlan, "costUsd"> | null {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end > start) s = s.slice(start, end + 1);

  let obj: unknown;
  try {
    obj = JSON.parse(s);
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;

  const rec = obj as Record<string, unknown>;
  const isDocument = typeof rec.isDocument === "boolean" ? rec.isDocument : true;
  const docTypeKa = typeof rec.docTypeKa === "string" ? rec.docTypeKa.trim().slice(0, 100) : "";
  const docTypeEn = typeof rec.docTypeEn === "string" ? rec.docTypeEn.trim().slice(0, 100) : "";
  const checklist = Array.isArray(rec.checklist)
    ? rec.checklist
        .filter((c): c is string => typeof c === "string")
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 10)
    : [];
  const matchedTemplateTypeRaw =
    typeof rec.matchedTemplateType === "string" ? rec.matchedTemplateType.trim() : "";
  const matchedTemplateType = (TEMPLATE_TYPES as readonly string[]).includes(matchedTemplateTypeRaw)
    ? matchedTemplateTypeRaw
    : "";

  return { isDocument, docTypeKa, docTypeEn, checklist, matchedTemplateType };
}

export async function planCustomDocument(details: string, locale: Locale): Promise<DocPlan> {
  const fallback: DocPlan = {
    isDocument: true,
    docTypeKa: "დოკუმენტი",
    docTypeEn: "Document",
    checklist: [],
    matchedTemplateType: "",
    costUsd: 0,
  };

  if (!process.env.OPENROUTER_API_KEY) return fallback;

  const messages: ChatMessage[] = [
    { role: "system", content: locale === "en" ? PLAN_SYSTEM_EN : PLAN_SYSTEM_KA },
    { role: "user", content: details },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { content: raw, costUsd } = await callOpenRouter(messages, {
        model: FAST_MODEL,
        temperature: 0,
        maxTokens: 500,
        json: true,
        timeoutMs: 15_000,
      });
      const parsed = parsePlan(raw);
      if (!parsed) return { ...fallback, costUsd };
      return { ...parsed, costUsd };
    } catch {
      if (attempt === 0) continue;
    }
  }
  return fallback;
}
