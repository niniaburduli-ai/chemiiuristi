import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { DocumentReview } from "@/lib/models/document-review";
import { callOpenRouterChat } from "@/lib/ai-call";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 10_000;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/octet-stream", // fallback — extension checked separately
]);
const ALLOWED_EXTS = new Set([".pdf", ".docx", ".txt", ".md", ".text"]);

const SYSTEM = `შენ ხარ ქართული იურიდიული დოკუმენტების ანალიტიკოსი.
გაანალიზე მოწოდებული დოკუმენტი და მიეცი:
1. მოკლე შეჯამება (2-3 წინადადება)
2. ძირითადი იურიდიული პრობლემები ან შეშფოთებები
3. რეკომენდაციები გასაუმჯობესებლად ან სამოქმედოდ
4. რისკის შეფასება 0-დან 100-მდე (0=რისკი არ არის, 100=კრიტიკული იურიდიული რისკი)

უპასუხე ქართულ ენაზე. გამოიყენე ზუსტად შემდეგი ფორმატი:

SUMMARY: [შეჯამება]
FINDINGS: [პრობლემა 1] | [პრობლემა 2] | [პრობლემა 3]
RECOMMENDATIONS: [რეკ. 1] | [რეკ. 2] | [რეკ. 3]
RISK_SCORE: [მთელი რიცხვი 0-100]`;

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    return "ფაილის ზომა არ უნდა აღემატებოდეს 5 MB-ს";
  }
  const ext = ("." + (file.name.split(".").pop() ?? "")).toLowerCase();
  if (!ALLOWED_MIMES.has(file.type) && !ALLOWED_EXTS.has(ext)) {
    return "მხარდაჭერილი ფორმატები: PDF, DOCX, TXT, MD";
  }
  return null;
}

async function extractText(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = ("." + (file.name.split(".").pop() ?? "")).toLowerCase();

  if (ext === ".pdf" || file.type === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buf });
    const textResult = await parser.getText();
    return textResult.text;
  }

  if (
    ext === ".docx" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value;
  }

  return buf.toString("utf-8").replace(/\0/g, " ");
}

function parseReviewResponse(raw: string): {
  summary: string;
  findings: string[];
  recommendations: string[];
  riskScore: number | null;
} {
  const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]+?)(?=\nFINDINGS:|$)/);
  const findingsMatch = raw.match(/FINDINGS:\s*([\s\S]+?)(?=\nRECOMMENDATIONS:|$)/);
  const recsMatch = raw.match(/RECOMMENDATIONS:\s*([\s\S]+?)(?=\nRISK_SCORE:|$)/);
  const riskMatch = raw.match(/RISK_SCORE:\s*(\d{1,3})/);

  const summary = summaryMatch?.[1]?.trim() ?? raw.slice(0, 400);
  const findings = (findingsMatch?.[1] ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  const recommendations = (recsMatch?.[1] ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  let riskScore: number | null = null;
  if (riskMatch) {
    const n = Math.round(parseInt(riskMatch[1], 10));
    if (!isNaN(n)) riskScore = Math.min(100, Math.max(0, n));
  }

  return { summary, findings, recommendations, riskScore };
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const isAdmin = user.role === "admin";
  if (!isAdmin && (user.docReviewRemaining ?? 0) <= 0) {
    return NextResponse.json(
      { error: "Document review quota exceeded. Please upgrade your plan." },
      { status: 403 }
    );
  }

  const ct = req.headers.get("content-type") ?? "";
  let text = "";
  let fileName = "document";

  if (ct.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    if (file && file.size > 0) {
      const validationError = validateFile(file);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
      fileName = file.name;
      try {
        text = await extractText(file);
      } catch (err) {
        return NextResponse.json(
          { error: String(err instanceof Error ? err.message : err) },
          { status: 502 }
        );
      }
    } else if (pastedText) {
      text = pastedText;
    }
  } else {
    try {
      const body = (await req.json()) as { text?: string; fileName?: string };
      text = String(body.text ?? "");
      fileName = String(body.fileName ?? "document");
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
  }

  text = text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  if (!text) {
    return NextResponse.json({ error: "No document text provided" }, { status: 400 });
  }

  let raw: string;
  try {
    raw = await callOpenRouterChat([
      { role: "system", content: SYSTEM },
      { role: "user", content: `გაანალიზე ეს დოკუმენტი:\n\n${text}` },
    ]);
  } catch (err) {
    return NextResponse.json(
      {
        error: "AI service unavailable",
        detail: String(err instanceof Error ? err.message : err),
      },
      { status: 502 }
    );
  }

  const { summary, findings, recommendations, riskScore } = parseReviewResponse(raw);

  const reviewCreate = DocumentReview.create({
    userId: session.user.id,
    fileName,
    summary,
    findings,
    recommendations,
    riskScore,
  });
  const saveOps: Promise<unknown>[] = [reviewCreate];
  if (!isAdmin) {
    saveOps.push(
      User.findByIdAndUpdate(session.user.id, { $inc: { docReviewRemaining: -1 } })
    );
  }
  const [review] = await Promise.all(saveOps);

  return NextResponse.json(
    {
      id: String((review as { _id: unknown })._id),
      fileName,
      summary,
      findings: findings ?? [],
      recommendations: recommendations ?? [],
      riskScore,
    },
    { status: 201 }
  );
}
