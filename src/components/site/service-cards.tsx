import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AnimateIn } from "@/components/site/AnimateIn";
import type { Dict } from "@/lib/i18n/dictionaries";
import type { FeatureFlagsData } from "@/lib/features";

export function ServiceCards({
  cardsHeading,
  d,
  flags,
}: {
  cardsHeading: string;
  d: Dict;
  flags: FeatureFlagsData;
}) {
  const items = [
    { key: "chat", label: d.servicesModal.aiTab, enabled: flags.chat },
    { key: "generate", label: d.servicesModal.templatesTab, enabled: flags.generate },
    { key: "review", label: d.documentAnalysis.title, enabled: flags.review },
  ].filter((i) => i.enabled);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-10">
        {cardsHeading}
      </h2>
      <AnimateIn>
        <div className="max-w-md mx-auto border-t-[3px] border-t-primary bg-card border border-border rounded-2xl p-7 flex flex-col gap-5 card-hover">
          <ul className="space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex gap-2.5 items-center">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-foreground/80">{i.label}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold py-3 rounded-xl btn-hover"
          >
            {d.home.learnMore}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AnimateIn>
    </section>
  );
}
