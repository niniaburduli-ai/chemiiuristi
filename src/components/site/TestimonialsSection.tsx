"use client";

import { useState } from "react";
import { Star, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ApprovedFeedback } from "@/lib/feedback";

const SECONDS_PER_CARD = 5;

function StarRow({ rating, className = "" }: { rating: number | null; className?: string }) {
  if (!rating) return null;
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "fill-gold text-gold" : "fill-none text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:bg-gold/10 dark:text-gold">
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}

function TestimonialCard({
  f,
  onSelect,
}: {
  f: ApprovedFeedback;
  onSelect: (f: ApprovedFeedback) => void;
}) {
  return (
    <div
      onClick={() => onSelect(f)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(f)}
      className="shrink-0 w-[280px] sm:w-[340px] rounded-2xl border border-border bg-card p-6 flex flex-col card-hover cursor-pointer"
    >
      <StarRow rating={f.rating} className="mb-2" />
      <p className="text-sm text-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">
        {f.message}
      </p>
      <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border">
        <Avatar initials={f.initials} />
      </div>
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
  const [selected, setSelected] = useState<ApprovedFeedback | null>(null);

  if (items.length === 0) return null;

  const loop = items.length > 1;
  const duration = items.length * SECONDS_PER_CARD;

  return (
    <section className="bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{heading}</h2>
          <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-gold mx-auto mt-4 rounded-full" />
        </div>

        <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <div
            className={`flex w-max gap-5 ${loop ? "animate-marquee group-hover:[animation-play-state:paused]" : ""}`}
            style={loop ? ({ "--marquee-duration": `${duration}s` } as React.CSSProperties) : undefined}
          >
            {(loop ? [...items, ...items] : items).map((f, idx) => (
              <TestimonialCard key={`${f.id}-${idx}`} f={f} onSelect={setSelected} />
            ))}
          </div>
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg bg-background">
          {selected && (
            <>
              <DialogHeader>
                <StarRow rating={selected.rating} />
                <DialogTitle className="sr-only">
                  {selected.initials || "Testimonial"}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {selected.message}
              </p>
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Avatar initials={selected.initials} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
