"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  FileSearch,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { riskBadge } from "@/lib/risk-score";
import { DOC_TYPES } from "@/lib/validators";
import { DocumentDownloadButton } from "@/components/site/document-download-button";

// ── Serializable types (ObjectId and Date stripped in page.tsx server component)

export type SerializedDoc = {
  id: string;
  title: string;
  type: string;
  content: string;
  createdAt: string | null;
};

export type SerializedReview = {
  id: string;
  fileName: string;
  summary: string;
  findings: string[];
  recommendations: string[];
  riskScore: number | null;
  createdAt: string | null;
};

type ReviewResult = {
  id: string;
  fileName: string;
  summary: string;
  findings: string[];
  recommendations: string[];
  riskScore: number | null;
};

type Tab = "analyze" | "generated";

function parseTab(raw: string | null): Tab {
  return raw === "generated" ? "generated" : "analyze";
}

// ── Root component

export function DocumentsClient({
  docs,
  reviews: initialReviews,
}: {
  docs: SerializedDoc[];
  reviews: SerializedReview[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<SerializedReview[]>(initialReviews);
  const fileRef = useRef<HTMLInputElement>(null);

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setText("");
    setError(null);
  }

  function clearFile() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setError(null);
  }

  const analyze = useCallback(async () => {
    if (!file && !text.trim()) {
      toast.error("ჩასვი ტექსტი ან ატვირთე ფაილი");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    if (file) {
      fd.append("file", file);
    } else {
      fd.append(
        "file",
        new Blob([text.trim()], { type: "text/plain" }),
        "document.txt"
      );
    }

    try {
      const res = await fetch("/api/review", { method: "POST", body: fd });
      const data = await res.json() as {
        id?: string;
        fileName?: string;
        summary?: string;
        findings?: string[];
        recommendations?: string[];
        riskScore?: number | null;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "შეცდომა მოხდა");
        return;
      }
      const newResult: ReviewResult = {
        id: data.id ?? "",
        fileName: data.fileName ?? "document",
        summary: data.summary ?? "",
        findings: data.findings ?? [],
        recommendations: data.recommendations ?? [],
        riskScore: typeof data.riskScore === "number" ? data.riskScore : null,
      };
      setResult(newResult);
      setReviews((prev) => [
        {
          id: newResult.id,
          fileName: newResult.fileName,
          summary: newResult.summary,
          findings: newResult.findings,
          recommendations: newResult.recommendations,
          riskScore: newResult.riskScore,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      toast.success("ანალიზი დასრულდა");
    } catch (err) {
      console.error("[analyze] fetch error:", err);
      setError("სერვისთან კავშირი ვერ დამყარდა");
    } finally {
      setLoading(false);
    }
  }, [file, text]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      {/* ── Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">დოკუმენტები</h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "analyze"
              ? `${reviews.length} ანალიზი`
              : `${docs.length} გენერირებული დოკუმენტი`}
          </p>
        </div>
      </div>

      {/* ── Tab bar */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setTab("analyze")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "analyze"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSearch className="inline h-4 w-4 mr-1.5 align-middle" />
          ანალიზი
        </button>
        <button
          onClick={() => setTab("generated")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === "generated"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="inline h-4 w-4 mr-1.5 align-middle" />
          გენერირებული
        </button>
      </div>

      {/* ── Tab: Analyze */}
      {activeTab === "analyze" && (
        <div className="space-y-6">
          <Card className="border-t-[3px] border-t-primary rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">ატვირთე ან ჩასვი ტექსტი</CardTitle>
              <CardDescription>
                PDF, DOCX, TXT, MD — მაქსიმუმ 5 MB. ფაილი ანალიზის შემდეგ ავტომატურად
                იშლება.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File picker */}
              <div className="space-y-2">
                <Label>ფაილის ატვირთვა</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 justify-start font-normal truncate"
                  >
                    <Upload className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {file ? file.name : "აირჩიე ფაილი (.pdf, .docx, .txt, .md)"}
                    </span>
                  </Button>
                  {file && (
                    <Button variant="ghost" size="icon" onClick={clearFile} title="გასუფთავება">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.text"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* OR divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t" />
                <span className="text-xs text-muted-foreground">ან</span>
                <div className="flex-1 border-t" />
              </div>

              {/* Text paste */}
              <div className="space-y-2">
                <Label htmlFor="doc-text">ტექსტის ჩასმა</Label>
                <Textarea
                  id="doc-text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (file) clearFile();
                  }}
                  placeholder="ჩასვი დოკუმენტის ტექსტი აქ..."
                  className="min-h-[140px]"
                  disabled={!!file}
                />
                <p className="text-xs text-muted-foreground">
                  {text.length} / 10 000 სიმბოლო
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <Button onClick={analyze} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ანალიზი მიმდინარეობს...
                  </>
                ) : (
                  <>
                    <FileSearch className="mr-2 h-4 w-4" />
                    გააანალიზე
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {result && <ReviewResultCard result={result} />}

          {/* History */}
          {reviews.length > 0 && (
            <>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ანალიზის ისტორია
              </p>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <ReviewHistoryCard key={r.id} review={r} />
                ))}
              </div>
            </>
          )}

          {reviews.length === 0 && !result && (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground text-sm">
                  ჯერ დოკუმენტი არ გაქვს გაანალიზებული.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Generated */}
      {activeTab === "generated" && (
        <div>
          {docs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">ჯერ დოკუმენტი არ გენერირებულა.</p>
                <Link href="/generate" className={buttonVariants()}>
                  შექმენი დოკუმენტი
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {docs.map((doc) => {
                const typeName =
                  DOC_TYPES[doc.type as keyof typeof DOC_TYPES] ?? doc.type;
                return (
                  <Card key={doc.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{doc.title}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {typeName}
                            </Badge>
                            {doc.createdAt && (
                              <span className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {new Date(doc.createdAt).toLocaleDateString("ka-GE")}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <DocumentDownloadButton
                          content={doc.content}
                          filename={`${doc.title}.txt`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded p-3 max-h-40 overflow-y-auto leading-relaxed">
                        {doc.content.slice(0, 500)}
                        {doc.content.length > 500 ? "…" : ""}
                      </pre>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-components

function ReviewResultCard({ result }: { result: ReviewResult }) {
  const badge = riskBadge(result.riskScore);
  return (
    <Card className="border-t-[3px] border-t-primary rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4 shrink-0" />
              {result.fileName}
            </CardTitle>
            <CardDescription className="mt-1">
              ანალიზი დასრულდა — შედეგი შენახულია
            </CardDescription>
          </div>
          {badge && (
            <Badge
              variant="outline"
              className={`text-xs shrink-0 font-mono ${badge.className}`}
            >
              {badge.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">შეჯამება</p>
          <p className="text-sm leading-relaxed">{result.summary}</p>
        </div>

        {result.findings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-destructive" />
              ნაპოვნი პრობლემები ({result.findings.length})
            </p>
            <ul className="space-y-1.5">
              {result.findings.map((f, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              რეკომენდაციები ({result.recommendations.length})
            </p>
            <ul className="space-y-1.5">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewHistoryCard({ review }: { review: SerializedReview }) {
  const badge = riskBadge(review.riskScore);
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
              {review.fileName}
            </CardTitle>
            {review.createdAt && (
              <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                {new Date(review.createdAt).toLocaleDateString("ka-GE")}
              </CardDescription>
            )}
          </div>
          {badge && (
            <Badge
              variant="outline"
              className={`text-xs shrink-0 font-mono ${badge.className}`}
            >
              {badge.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {review.summary.length > 200
            ? review.summary.slice(0, 200) + "…"
            : review.summary}
        </p>
        {review.findings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> ნაპოვნი პრობლემები
            </p>
            <ul className="space-y-1">
              {review.findings.slice(0, 3).map((f, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  {f}
                </li>
              ))}
              {review.findings.length > 3 && (
                <li className="text-xs text-muted-foreground ml-3.5">
                  +{review.findings.length - 3} სხვა...
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
