import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { Consultation } from "@/lib/models/consultation";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RawSource = { title?: string; articleNumber?: string; url?: string };

/** Groups flat per-paragraph sources into (law, article, points[]) for display. */
function groupSources(
  sources: RawSource[]
): Array<{ label: string; url?: string }> {
  const map = new Map<string, { label: string; url?: string; points: string[] }>();
  for (const s of sources) {
    const title = s.title ?? "";
    const raw = s.articleNumber ?? "";
    // Strip paragraph/subparagraph suffix to get base article: "მუხლი X პ.Y" → "მუხლი X"
    const baseArticle = raw.replace(/\s+[პქ]\.[^\s]+/g, "").trim();
    // Extract point notation (e.g. "3.1" from "პ.3.1")
    const pointMatch = raw.match(/[პქ]\.(\S+)/g);
    const point = pointMatch ? pointMatch.map((p) => p.replace(/^[პქ]\./, "")).join(" ") : "";
    const key = `${title}|${baseArticle}|${s.url ?? ""}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        label: baseArticle ? `${title} — ${baseArticle}` : title,
        url: s.url,
        points: point ? [point] : [],
      });
    } else if (point && !existing.points.includes(point)) {
      existing.points.push(point);
    }
  }
  return [...map.values()].map(({ label, url, points }) => ({
    label: points.length > 0 ? `${label}, პუნქტი${points.length > 1 ? "ები" : ""}: ${points.join("; ")}` : label,
    url,
  }));
}

export const dynamic = "force-dynamic";

export default async function ConsultationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/consultations");

  await dbConnect();
  const items = await Consultation.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">კონსულტაციების ისტორია</h1>
          <p className="text-sm text-muted-foreground">{items.length} კონსულტაცია</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">ჯერ კონსულტაცია არ გაქვს.</p>
            <Link href="/chat" className={buttonVariants()}>
              დაიწყე კონსულტაცია
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const id = String((item as { _id: unknown })._id);
            const created = (item as { createdAt?: Date }).createdAt;
            const sources = item.sources ?? [];
            return (
              <Card key={id} id={id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-semibold leading-snug">
                      {item.question}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 pt-0.5">
                      <Clock className="h-3 w-3" />
                      {created ? new Date(created).toLocaleDateString("ka-GE") : ""}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {item.answer}
                  </p>
                  {sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        იურიდიული საფუძველი:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {groupSources(sources as RawSource[]).map((g, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {g.label}
                          </Badge>
                        ))}
                      </div>
                      {sources[0]?.url && (
                        <a
                          href={sources[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <BookOpen className="h-3 w-3" /> წყარო
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
