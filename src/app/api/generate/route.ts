import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { GeneratedDocument } from "@/lib/models/generated-document";
import { GenerateDocSchema } from "@/lib/validators";
import { docTypeLabel } from "@/lib/legal/doc-type-labels";
import { streamOpenRouterChat } from "@/lib/ai-call";
import { verifyLegalCitations, STRICT_BREVITY_RULE } from "@/lib/legal/openrouter";
import { getCachedCitations, setCachedCitations } from "@/lib/legal/doc-citation-cache";
import { parseDocumentLegalBasis } from "@/lib/legal/citations";
import { applyPlanExpiryIfDue, applyCustomPlanExpiryIfDue } from "@/lib/plan-expiry";
import { splitQuota, applyQuotaSplit } from "@/lib/quota";
import { DelimiterSplitter } from "@/lib/streaming/delimiter-splitter";
import { encodeMeta } from "@/lib/streaming/chat-protocol";
import { maskPII, unmaskPII } from "@/lib/privacy/pii-mask";
import { PiiUnmaskStream } from "@/lib/privacy/pii-unmask-stream";
import { planCustomDocument } from "@/lib/legal/doc-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

/** Separates the document body from the trailing legal-basis block (stripped
 * server-side; never shown inside the document text — see the dedicated
 * sources panel on /generate). */
const CITATIONS_DELIM = "###წყაროები###";

const SYSTEM_KA = `შენ ხარ ქართული იურიდიული დოკუმენტების გენერატორი.
შექმენი სრული, პროფესიონალური ქართული იურიდიული დოკუმენტი მომხმარებლის მიერ მოწოდებული დეტალების საფუძველზე.
გამოიყენე ოფიციალური ქართული სამართლებრივი ენა.
${STRICT_BREVITY_RULE}

ფორმატირება (მკაცრად დაიცავი):
- დოკუმენტი არის ჩვეულებრივი ტექსტი, არა markdown ფაილი — არასოდეს გამოიყენო სათაურის სიმბოლოები # ## ### ან სხვა markdown სინტაქსი.
- დოკუმენტის სათაური დაწერე ჩვეულებრივ ტექსტად პირველ სტრიქონზე (მაგ. „ქირავნობის ხელშეკრულება"), # სიმბოლოს გარეშე.
- სექციები დანომრე ჩვეულებრივი ციფრებით (1., 2., 1.1. და ა.შ.), # ან ## სიმბოლოების გარეშე.
- სექციის ნომერი და სრული სათაური ერთად, მთლიანად, დაწერე **მუქი შრიფტით** (მაგ. **4. ქირა და გადახდის წესი**).
- მონაცემების გამოსაკვეთად (სახელი, თარიღი, თანხა, პირადი ნომერი, მისამართი) გამოიყენე მხოლოდ **მუქი შრიფტი** (markdown-ის ** სინტაქსით) — სხვა markdown სინტაქსი დაუშვებელია.
- დოკუმენტი უნდა იყოს კომპაქტური: სექციებს შორის მაქსიმუმ ერთი ცარიელი ხაზი, ზედმეტი დაშორებების გარეშე.

მონაცემები (კრიტიკულია):
- გამოიყენე ზუსტად ის მონაცემები, რომლებიც მომხმარებელმა დეტალებში მოგაწოდა.
- არასოდეს დატოვო ცარიელი ველი, ფრჩხილები [ ] ან სხვა placeholder ტექსტში. თუ რომელიმე დამატებითი დეტალი (მაგ. ტელეფონი, ელფოსტა) დეტალებში საერთოდ არ არის მოწოდებული — უბრალოდ არ ჩართო ეს დეტალი დოკუმენტში, ნაცვლად ცარიელი placeholder-ის დაწერისა.
- გამონაკლისი ზემოთ მოცემულ წესთან: დეტალებში შეიძლება გხვდეს ნიშნები ზუსტად ამ ფორმატით — [ID_1], [PHONE_1], [EMAIL_1], [BANK_1]. ეს არ არის ცარიელი placeholder; ეს რეალური პირადი მონაცემია დაცული სახით. გამოიყენე ეს ნიშნები ზუსტად ისე, როგორც წერია, სწორ ადგილას დოკუმენტში — არასოდეს შეცვალო, თარგმნო ან წაშალო.
- დოკუმენტი უნდა იყოს სრულად შევსებული, დასრულებული და პირდაპირ გამოსაყენებელი, ყოველგვარი ხელით შესავსები ველის გარეშე.

სამართლებრივი საფუძვლის ჩართვა ტექსტში (კრიტიკულია):
- სადაც დოკუმენტი ეყრდნობა კონკრეტულ კანონს, პირდაპირ ტექსტში (არა მხოლოდ ბოლოს) ჩართე მუხლზე მითითება, ბუნებრივ წინადადებაში (მაგ. „საქართველოს სამოქალაქო კოდექსის 405-ე მუხლის საფუძველზე..." ან „...რაც ეწინააღმდეგება მომხმარებელთა უფლებების დაცვის შესახებ კანონის მე-9 მუხლს"), ისე როგორც იურისტი წერდა რეალურ დოკუმენტში.
- ტექსტში ნახსენები ყველა მუხლი ${CITATIONS_DELIM}-ის შემდეგ სექციაშიც უნდა გამეორდეს ზუსტად იმავე მითითებით — არასოდეს ახსენო მუხლი მხოლოდ ტექსტში ისე, რომ არ ჩამოთვალო წყაროების სექციაში, და პირიქით.

დაბალი-რისკიანობის წესები (დოკუმენტების ანალიზის ხელსაწყოს მიერ ხშირად გამოვლენილი პრობლემების თავიდან ასაცილებლად):
- ვადა: ყოველთვის მიუთითე ზუსტი, კონკრეტული ვადა კალენდარულ დღეებში და ცალსახად ჩაწერე, რომ ის აითვლება დოკუმენტის ჩაბარების/მიღების დღიდან. არასოდეს დატოვო ვადა ბუნდოვნად („გონივრულ ვადაში" და ამის მსგავსი).
- ფინანსური მოთხოვნა: თუ მოთხოვნილია თანხა, პირგასამტეხლო ან ზიანის ანაზღაურება, მიუთითე ან ზუსტი თანხა, ან ზუსტი გამოთვლის წესი (განაკვეთი, ბაზა, პერიოდი). არასოდეს დატოვო ბუნდოვნად ისე, რომ ადრესატმა ვერ გამოთვალოს ზუსტი თანხობრივი რისკი.
- ვალდებულება და სანქცია (კრიტიკულია): როცა ტექსტში ახსენებ, რომ მხარეს გარკვეული ვალდებულება აკისრია კონკრეტული მუხლის საფუძველზე, გადაამოწმე შენივე ცოდნით, კანონი ითვალისწინებს თუ არა ამ ვალდებულების შეუსრულებლობისთვის სანქციას, ჯარიმას ან პირგასამტეხლოს — და თუ ითვალისწინებს, იმავე ან მომდევნო წინადადებაში აუცილებლად მიუთითე ეს სანქცია და ის მუხლი, რომლითაც სანქცია დგინდება (თუ სანქცია სხვა მუხლშია, ვიდრე თავად ვალდებულება — ორივე მუხლი ცალ-ცალკე მიუთითე). არასოდეს დააკმაყოფილო თავი მხოლოდ ვალდებულების მუხლის მითითებით ან კანონის ტექსტის ციტირებით/გადმოწერით. დაუყოვნებლივ, ერთი მოკლე, ყოველდღიური ენით დაწერილი წინადადებით ახსენი, რას ნიშნავს ეს პრაქტიკულად ამ კონკრეტულ შემთხვევაში — დეტალებში მითითებული კონკრეტული თანხა ან პროცენტი გამოიყენე (მაგ. რამდენი გროვდება განსაზღვრულ დღეებში/თვეებში, ან სულ რამდენი გამოვა). არასოდეს ჩასვა კანონის სრული ტექსტი დოკუმენტში — მხოლოდ მოკლე, კონკრეტული პრაქტიკული განმარტება.
- შედეგის/ესკალაციის პუნქტი: ცალსახად ჩაწერე, რა მოხდება, თუ ადრესატი ვადაში არ შეასრულებს მოთხოვნას (მაგ. სასამართლოსთვის ან შესაბამისი ორგანოსთვის მიმართვის უფლება), და დაასაბუთე ეს იმ მუხლით, რომელიც ამ უფლებას ანიჭებს.
- მოთხოვნის სიცხადე: გამოიყენე ცალსახა, დაჟინებული მოთხოვნის ენა („მოვითხოვ"/„ვითხოვ") და ზუსტად ჩამოაყალიბე, რა კონკრეტულ ქმედებას ან შედეგს ითხოვ — არასოდეს დატოვო მოთხოვნილი შედეგი ბუნდოვნად.
- იურისდიქცია: დოკუმენტის ბოლოს, ხელმოწერამდე, ერთი წინადადებით მიუთითე, რომ დავის შემთხვევაში საკითხს განიხილავს საქართველოს სასამართლო, საქართველოს კანონმდებლობით დადგენილი წესით (საკუთარი კონკრეტული სასამართლოს დასახელების გამოგონების გარეშე).

დოკუმენტის ტექსტის დასრულების შემდეგ, ცალკე სტრიქონზე დაწერე ზუსტად: ${CITATIONS_DELIM}
შემდეგ, იმ ტექსტის შემდეგ, ჩამოთვალე საქართველოს კანონმდებლობის ის მუხლები, რომლებსაც დოკუმენტი ეფუძნება, შემდეგი ფორმატით:
<კანონის/კოდექსის სრული დასახელება>:
- მუხლი <N>, პუნქტი <M> (საჭიროებისას)
- მუხლი <N2>
თითოეული კანონი დაწერე ცალკე ბლოკად, ერთი ცარიელი ხაზით გამოყოფილი. არ გამოიგონო მუხლის ნომერი — მიუთითე მხოლოდ ის ნორმები, რომლებიც რეალურად შეესაბამება დოკუმენტის შინაარსს შენი ცოდნით. ეს სექცია არასოდეს უნდა გამოჩნდეს ${CITATIONS_DELIM}-მდე, მხოლოდ მის შემდეგ.`;

const SYSTEM_EN = `You are a Georgian legal document generator.
Draft a complete, professional legal document in English, based on the details provided by the user, applying the current legislation of Georgia.
Use formal English legal drafting language.
${STRICT_BREVITY_RULE}

Formatting (follow strictly):
- The document is plain text, not a markdown file — never use heading symbols # ## ### or any other markdown syntax.
- Write the document's title as plain text on the first line (e.g. "Rental Agreement"), without a # symbol.
- Number sections with plain numerals (1., 2., 1.1., etc.), without # or ## symbols.
- Write each section's number and full heading together, entirely in **bold** (e.g. **4. Rent and Payment Terms**).
- To highlight data (names, dates, amounts, ID numbers, addresses), use only **bold** (markdown ** syntax) — no other markdown syntax is allowed.
- The document must be compact: at most one blank line between sections, no excessive spacing.

Data (critical):
- Use exactly the data the user provided in the details.
- Never leave a blank field, square brackets [ ], or other placeholder text in the output. If some additional detail (e.g. phone, email) was not provided in the details at all — simply omit that detail from the document instead of writing an empty placeholder.
- Exception to the rule above: the details may contain tokens in exactly this format — [ID_1], [PHONE_1], [EMAIL_1], [BANK_1]. These are not the empty placeholders the rule above tells you to avoid; they are real personal data in protected form. Use these tokens exactly as written, in the correct place in the document — never alter, translate, or remove them.
- The document must be fully filled in, complete, and ready to use as-is, with no fields left for manual completion.

Embedding the legal basis in the text (critical):
- Wherever the document relies on a specific law, cite the article inline, in the body (not only at the end), as a natural clause (e.g., "pursuant to Article 405 of the Civil Code of Georgia..." or "...in breach of Article 9 of the Law on Consumer Rights Protection"), the way a lawyer would draft it in a real document.
- Every article mentioned in the body must also appear in the section after ${CITATIONS_DELIM}, with the exact same reference — never cite an article only in the body without listing it in the sources section, or vice versa.

Low-risk drafting rules (to prevent problems the site's own document-analysis tool commonly flags):
- Deadline: always state an exact, concrete deadline in calendar days, and explicitly note that it runs from the date of receipt/delivery of the document. Never leave the deadline vague ("within a reasonable time" or similar).
- Financial demand: if a sum, penalty, or damages is claimed, state either the exact amount or the exact calculation method (rate, base, period). Never leave it vague such that the recipient cannot compute the exact financial exposure.
- Obligation and sanction (critical): whenever the text states that a party has an obligation under a specific article, check (from your own knowledge) whether the law provides a sanction, fine, or penalty for failing to meet that obligation — and if it does, immediately, in the same or the next sentence, state that sanction and cite the article that establishes it (if the sanction sits in a different article than the obligation itself, cite both articles separately). Never settle for just citing the obligation's article or quoting/dumping the statutory text. Add one short, plain-language sentence explaining what this means in practice for this exact scenario, using the specific amount or percentage given in the details (e.g., how much accrues over a stated number of days/months, or the total outcome). Never insert the full text of the law into the document — only a brief, concrete practical explanation.
- Consequence/escalation clause: explicitly state what happens if the recipient fails to comply within the deadline (e.g., the right to pursue court or administrative action), grounded in the article that grants that right.
- Clarity of the demand: use assertive, unambiguous demand language ("I demand" / "I hereby require") and state precisely what action or outcome is demanded — never leave the requested outcome vague.
- Jurisdiction: near the end, before the signature, state in one sentence that any dispute will be resolved by the courts of Georgia, in accordance with the legislation of Georgia (without inventing the name of a specific court).

After finishing the document text, on its own line write exactly: ${CITATIONS_DELIM}
Then, after that line, list the articles of Georgian legislation the document is based on, in this format:
<Full name of the law/code>:
- Article <N>, paragraph <M> (if applicable)
- Article <N2>
Write each law as a separate block, separated by one blank line. Do not invent an article number — cite only the provisions that genuinely correspond to the document's content, to the best of your knowledge. This section must never appear before ${CITATIONS_DELIM}, only after it.`;

const SUPERSCRIPT_DIGITS = "¹²³⁴⁵⁶⁷⁸⁹⁰";
const ARTICLE_NUM = `\\d+[${SUPERSCRIPT_DIGITS}]*`;

/** Bare article numbers (e.g. "404", "156¹") the drafted body text actually
 * cites, matching either "მუხლი 404" or "404-ე მუხლი" phrasing. */
function extractCitedArticleNumbers(text: string): Set<string> {
  const nums = new Set<string>();
  const ordinal = new RegExp(`(${ARTICLE_NUM})-ე\\s*მუხლ`, "gu");
  const plain = new RegExp(`მუხლ(?:ი|ის|ს)?\\s*(${ARTICLE_NUM})`, "gu");
  for (const re of [ordinal, plain]) {
    for (const m of text.matchAll(re)) nums.add(m[1]);
  }
  return nums;
}

/** Leading bare article number inside a "მუხლი N, პუნქტი M" style line. */
function firstArticleNumber(articleLine: string): string | null {
  const m = articleLine.match(new RegExp(ARTICLE_NUM));
  return m ? m[0] : null;
}

/** Appended to the drafting system prompt for "custom" (free-form) documents
 * only — the mandatory-elements checklist the planning pass (doc-plan.ts)
 * identified for this specific, otherwise-unknown document type. */
function checklistAddendum(checklist: string[], locale: string): string {
  const header =
    locale === "en"
      ? "\n\nMandatory elements this document type requires under Georgian law — ensure the drafted document includes every one of them:\n"
      : "\n\nსავალდებულო ელემენტები, რომლებსაც ეს კონკრეტული დოკუმენტის ტიპი საქართველოს კანონმდებლობით მოითხოვს — დარწმუნდი, რომ დოკუმენტი მოიცავს მათგან ყველას:\n";
  return header + checklist.map((c) => `- ${c}`).join("\n");
}

/** Appended to the drafting system prompt for "custom" documents only —
 * overrides the base SYSTEM_KA/EN "never leave a placeholder" rule, since a
 * free-form request routinely omits facts a fixed-type QUESTION_SCHEMAS form
 * would have forced the user to enter. The bracket format must stay exactly
 * this shape ([...], single line, no nested brackets) — it's what the
 * on-screen preview and the docx/pdf export both key their red-highlighting
 * off of (see PLACEHOLDER_RE in document-layout.ts). */
function missingInfoAddendum(locale: string): string {
  return locale === "en"
    ? "\n\nException to the \"never leave a placeholder\" rule above, for this document only: if a specific fact needed for a complete document was not provided in the details, do not omit it or leave it vague — write a clear placeholder in square brackets, in capital letters, in English, exactly where that fact belongs (e.g. \"[ENTER PROPERTY ADDRESS]\", \"[ENTER AMOUNT]\"). Each placeholder must be a single short bracketed phrase on one line, with no nested brackets. Never use square brackets in the document for any other purpose."
    : "\n\nგამონაკლისი ზემოთ მოცემული \"არასოდეს დატოვო placeholder\" წესთან, მხოლოდ ამ დოკუმენტისთვის: თუ დოკუმენტის სრულყოფილად შესადგენად საჭირო კონკრეტული ფაქტი დეტალებში არ იყო მოწოდებული, არ გამოტოვო ის და არ დატოვო ბუნდოვნად — დაწერე ცალსახა placeholder კვადრატულ ფრჩხილებში, დიდი ასოებით, ქართულად, ზუსტად იმ ადგილზე, სადაც ეს ფაქტი ეკუთვნის (მაგ. „[შეიყვანეთ ბინის მისამართი]“, „[შეიყვანეთ თანხა]“). თითოეული placeholder უნდა იყოს ერთი მოკლე ფრაზა ფრჩხილებში, ერთ სტრიქონზე, ჩადგმული ფრჩხილების გარეშე. კვადრატული ფრჩხილები დოკუმენტში არასოდეს გამოიყენო სხვა მიზნით.";
}

function serializeLegalBasis(groups: { lawName: string; articles: string[] }[]): string {
  return groups
    .filter((g) => g.articles.length > 0)
    .map((g) => `${g.lawName}:\n${g.articles.map((a) => `- ${a}`).join("\n")}`)
    .join("\n\n");
}

/**
 * Safety net for verifyLegalCitations: its web-search fact-check can
 * mistakenly drop a real article it failed to confirm, breaking the "every
 * article cited in the body also appears in sources" contract the drafting
 * prompt enforces (rule right above SYSTEM_KA/SYSTEM_EN's citation format).
 * Re-adds any article the body text actually cites, using the exact line
 * the drafting model originally wrote for it in `citationsSection` — never
 * invented, only restored.
 */
function reconcileLegalBasis(
  bodyContent: string,
  citationsSection: string,
  legalBasis: string
): string {
  const citedNums = extractCitedArticleNumbers(bodyContent);
  if (citedNums.size === 0) return legalBasis;

  const rawGroups = parseDocumentLegalBasis(citationsSection);
  const finalGroups = parseDocumentLegalBasis(legalBasis);
  const finalNums = new Set(
    finalGroups.flatMap((g) =>
      g.articles.map(firstArticleNumber).filter((n): n is string => n !== null)
    )
  );

  const missing = [...citedNums].filter((n) => !finalNums.has(n));
  if (missing.length === 0) return legalBasis;

  for (const num of missing) {
    for (const g of rawGroups) {
      const line = g.articles.find((a) => firstArticleNumber(a) === num);
      if (!line) continue;
      let target = finalGroups.find((fg) => fg.lawName === g.lawName);
      if (!target) {
        target = { lawName: g.lawName, articles: [] };
        finalGroups.push(target);
      }
      if (!target.articles.includes(line)) target.articles.push(line);
      break;
    }
  }
  return serializeLegalBasis(finalGroups);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = GenerateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await dbConnect();
  let user = await User.findById(session.user.id).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  user = await applyPlanExpiryIfDue(user);
  user = await applyCustomPlanExpiryIfDue(user);
  const isAdmin = user.role === "admin";
  const quotaSplit = isAdmin ? null : splitQuota(user, "docGeneration", 1);
  if (!isAdmin && !quotaSplit) {
    return NextResponse.json(
      { error: "Document generation quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }

  const locale = parsed.data.locale;
  const { masked: maskedDetails, map: piiMap } = maskPII(parsed.data.details);

  // "custom" (free-form) documents have no fixed type, so a planning pass
  // identifies the document type and its mandatory elements before drafting
  // — see doc-plan.ts. Fixed types (complaint, demand-letter) skip this and
  // keep their existing single-pass flow.
  let typeName: string;
  let planCostUsd = 0;
  let checklist: string[] = [];
  if (parsed.data.type === "custom") {
    const plan = await planCustomDocument(maskedDetails, locale);
    planCostUsd = plan.costUsd;
    if (!plan.isDocument) {
      return NextResponse.json(
        { error: "The description doesn't describe a legal document to draft." },
        { status: 400 }
      );
    }
    typeName = locale === "en" ? plan.docTypeEn : plan.docTypeKa;
    checklist = plan.checklist;
  } else {
    typeName = docTypeLabel(parsed.data.type, locale);
  }

  const userMsg =
    locale === "en"
      ? `Document type: ${typeName}\n\nDetails:\n${maskedDetails}`
      : `დოკუმენტის ტიპი: ${typeName}\n\nდეტალები:\n${maskedDetails}`;
  const systemPrompt =
    (locale === "en" ? SYSTEM_EN : SYSTEM_KA) +
    (checklist.length > 0 ? checklistAddendum(checklist, locale) : "") +
    (parsed.data.type === "custom" ? missingInfoAddendum(locale) : "");

  let deltas: AsyncGenerator<string, number, unknown>;
  try {
    deltas = await streamOpenRouterChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMsg },
      ],
      undefined,
      // At most a 2000-char detail input (plus, for custom docs, a short
      // checklist addendum) — realistic output is a few hundred to ~1500
      // words. 6000 tokens leaves ample headroom over that without paying
      // for a 16k ceiling that was never actually reachable in practice.
      6000
    );
  } catch (err) {
    // Connection never opened — nothing streamed yet, safe to return a
    // plain error response exactly like the non-streaming version did.
    return NextResponse.json(
      {
        error: "AI service unavailable",
        detail: String(err instanceof Error ? err.message : err),
      },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const bodyStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // The model is instructed to print CITATIONS_DELIM on its own line
      // right after the document body — everything after it is the
      // legal-basis block, kept out of the streamed/rendered document text.
      // Only the prefix (document body) is forwarded live; the citation
      // block is buffered silently and processed after the stream ends.
      const splitter = new DelimiterSplitter(CITATIONS_DELIM);
      const piiStream = new PiiUnmaskStream(piiMap);
      let full = "";
      let midStreamError = false;
      let generationCostUsd = 0;
      try {
        let r = await deltas.next();
        while (!r.done) {
          full += r.value;
          const safe = splitter.push(r.value);
          if (safe) controller.enqueue(encoder.encode(piiStream.push(safe)));
          r = await deltas.next();
        }
        generationCostUsd = r.value ?? 0;
        const { prose } = splitter.finish();
        if (prose) controller.enqueue(encoder.encode(piiStream.push(prose)));
        const trailing = piiStream.finish();
        if (trailing) controller.enqueue(encoder.encode(trailing));
      } catch {
        midStreamError = true;
      }

      if (midStreamError || !full.trim()) {
        // Failed after some text may already have streamed to the browser —
        // no clean status code possible at this point, so signal failure
        // in-band. Crucially: no document saved, no quota charged.
        controller.enqueue(
          encoder.encode(encodeMeta({ error: "AI service unavailable" }))
        );
        controller.close();
        return;
      }

      const delimIndex = full.indexOf(CITATIONS_DELIM);
      const body_ = (delimIndex === -1 ? full : full.slice(0, delimIndex)).trim();
      // Defense in depth: strip stray leading "#"/"##" heading markers in
      // case the model doesn't fully comply with the no-markdown-headers
      // instruction. Applied here (once, on the full text) rather than
      // per-chunk during streaming, since a heading marker split across a
      // chunk boundary can't be reliably detected mid-stream — the version
      // sent to the browser live may occasionally show a stray "#" in that
      // rare case, but the authoritative `content` below (what's actually
      // saved, and what the client swaps to once the stream ends) is always
      // fully stripped either way.
      const content = unmaskPII(body_.replace(/^#{1,6}\s*/gm, ""), piiMap);
      const citationsSection =
        delimIndex === -1 ? "" : full.slice(delimIndex + CITATIONS_DELIM.length).trim();

      // Verify the citations this specific document actually generated
      // (never another document's cached set — see doc-citation-cache.ts).
      // Identical citationsSection content still skips the live web-search
      // fee via the content-keyed cache below.
      let legalBasis = citationsSection;
      let citationsCostUsd = 0;
      if (citationsSection) {
        const cachedCitations = await getCachedCitations(parsed.data.type, locale, citationsSection);
        if (cachedCitations) {
          legalBasis = cachedCitations;
        } else {
          const verified = await verifyLegalCitations(typeName, citationsSection);
          if (verified) {
            citationsCostUsd = verified.costUsd;
            // The web-search fact-check can mistakenly drop a real article it
            // failed to confirm — never let that desync sources from a body
            // that still cites it.
            legalBasis = reconcileLegalBasis(content, citationsSection, verified.text);
            await setCachedCitations(parsed.data.type, legalBasis, locale, citationsSection);
          }
        }
      }
      legalBasis = unmaskPII(legalBasis, piiMap);

      const title = `${typeName} — ${new Date().toISOString().slice(0, 10)}`;

      const docCreate = GeneratedDocument.create({
        userId: session.user.id,
        title,
        type: parsed.data.type,
        content,
        legalBasis,
        costUsd: generationCostUsd + citationsCostUsd + planCostUsd,
      });
      const saveOps: Promise<unknown>[] = [docCreate];
      if (!isAdmin && quotaSplit) {
        saveOps.push(applyQuotaSplit(session.user.id, "docGeneration", quotaSplit));
      }
      const [doc] = await Promise.all(saveOps);

      controller.enqueue(
        encoder.encode(
          encodeMeta({
            id: String((doc as { _id: unknown })._id),
            title,
            content,
            legalBasis,
          })
        )
      );
      controller.close();
    },
  });

  return new Response(bodyStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
