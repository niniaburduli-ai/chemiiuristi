"use client"
import { cn } from "@/lib/utils"

export type CMSSection =
  | "site-config" | "nav" | "homepage" | "about"
  | "faq" | "blog" | "footer" | "legal"

const sections: { id: CMSSection; label: string; sub: string }[] = [
  { id: "site-config", label: "საიტის პარამეტრები", sub: "Site Config" },
  { id: "nav", label: "ნავიგაცია", sub: "Navigation" },
  { id: "homepage", label: "მთავარი გვერდი", sub: "Homepage" },
  { id: "about", label: "ჩვენ შესახებ", sub: "About" },
  { id: "faq", label: "კითხვა-პასუხი", sub: "FAQ" },
  { id: "blog", label: "ბლოგი", sub: "Blog" },
  { id: "footer", label: "ქვედა კოლონტიტული", sub: "Footer" },
  { id: "legal", label: "სამართლებრივი", sub: "Legal Notices" },
]

interface Props { active: CMSSection; onSelect: (s: CMSSection) => void }

export function CMSSidebar({ active, onSelect }: Props) {
  return (
    <nav className="w-52 shrink-0 border-r bg-muted/30">
      <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        შინაარსი
      </p>
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={cn(
            "flex w-full flex-col px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted",
            active === s.id && "bg-muted font-medium text-foreground"
          )}
        >
          <span>{s.label}</span>
          <span className="text-xs text-muted-foreground">{s.sub}</span>
        </button>
      ))}
    </nav>
  )
}
