import { Star, User } from "lucide-react";
import type { ApprovedFeedback } from "@/lib/feedback";

function StarRow({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5 mb-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-gold text-gold" : "fill-none text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection({
  items,
  heading,
}: {
  items: ApprovedFeedback[];
  heading: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{heading}</h2>
          <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-gold mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f) => (
            <div
              key={f.id}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col card-hover"
            >
              <StarRow rating={f.rating} />
              <p className="text-sm text-foreground leading-relaxed flex-1 whitespace-pre-wrap">
                {f.message}
              </p>
              <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {f.initials || <User className="h-4 w-4" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
