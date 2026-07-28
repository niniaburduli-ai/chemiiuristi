"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ApprovedFeedback } from "@/lib/feedback";

const AUTOPLAY_MS = 4000;
const GAP_PX = 20;

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
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials || <User className="h-4 w-4" />}
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
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<ApprovedFeedback | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const activeRef = useRef(0);

  function scrollToIndex(idx: number) {
    const clamped = (idx + items.length) % items.length;
    cardRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  useEffect(() => {
    if (items.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => scrollToIndex(activeRef.current + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  function handleScroll() {
    const track = trackRef.current;
    const first = cardRefs.current[0];
    if (!track || !first) return;
    const step = first.offsetWidth + GAP_PX;
    const idx = Math.round(track.scrollLeft / step);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    activeRef.current = clamped;
    setActive(clamped);
  }

  if (items.length === 0) return null;

  return (
    <section className="bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">{heading}</h2>
          <div className="h-1.5 w-16 bg-gradient-to-r from-primary to-gold mx-auto mt-4 rounded-full" />
        </div>

        <div className="relative">
          <div
            ref={trackRef}
            onScroll={handleScroll}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((f, idx) => (
              <div
                key={f.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                onClick={() => setSelected(f)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setSelected(f)}
                className="snap-start shrink-0 w-full sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)] rounded-2xl border border-border bg-card p-6 flex flex-col card-hover cursor-pointer"
              >
                <StarRow rating={f.rating} className="mb-2" />
                <p className="text-sm text-foreground leading-relaxed flex-1 line-clamp-4 whitespace-pre-wrap">
                  {f.message}
                </p>
                <div className="mt-4 flex items-center gap-2 pt-4 border-t border-border">
                  <Avatar initials={f.initials} />
                </div>
              </div>
            ))}
          </div>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollToIndex(active - 1)}
                aria-label="Previous"
                className="hidden sm:flex absolute left-0 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 bg-card w-10 h-10 rounded-full shadow-lg border border-border items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all btn-hover"
              >
                <ChevronLeft className="h-5 w-5 text-gold" />
              </button>
              <button
                type="button"
                onClick={() => scrollToIndex(active + 1)}
                aria-label="Next"
                className="hidden sm:flex absolute right-0 translate-x-1/2 top-1/2 -translate-y-1/2 z-10 bg-card w-10 h-10 rounded-full shadow-lg border border-border items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all btn-hover"
              >
                <ChevronRight className="h-5 w-5 text-gold" />
              </button>
            </>
          )}
        </div>

        {items.length > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`${idx + 1}`}
                onClick={() => scrollToIndex(idx)}
                className={
                  idx === active
                    ? "h-2 w-8 rounded-full bg-primary transition-all"
                    : "h-2 w-2 rounded-full bg-border transition-all hover:bg-muted-foreground/40"
                }
              />
            ))}
          </div>
        )}
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
