"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Save, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GuideItem, GuideSection, GuideSource } from "@/types/cms"

function uid(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("")
}

function linesToArr(text: string): string[] {
  return text.split("\n").map((s) => s.trim()).filter(Boolean)
}
function arrToLines(arr?: string[]): string {
  return (arr ?? []).join("\n")
}

function newSection(): GuideSection {
  return { title: "", titleEn: "", paragraphs: [], paragraphsEn: [], list: [], listEn: [] }
}
function newSource(): GuideSource {
  return { label: "", labelEn: "", url: "" }
}
function newGuide(order: number): GuideItem {
  return {
    _id: uid(),
    slug: "",
    title: "", titleEn: "",
    description: "", descriptionEn: "",
    keywords: [], keywordsEn: [],
    intro: "", introEn: "",
    sections: [newSection()],
    sources: [],
    order,
    status: "draft",
  }
}

function SectionEditor({
  section, onChange, onRemove,
}: { section: GuideSection; onChange: (patch: Partial<GuideSection>) => void; onRemove: () => void }) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>ქვესათაური (KA)</Label>
          <Input value={section.title} onChange={(e) => onChange({ title: e.target.value })} />
        </div>
        <div>
          <Label>ქვესათაური (EN)</Label>
          <Input value={section.titleEn ?? ""} onChange={(e) => onChange({ titleEn: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>ტექსტი — თითო აბზაცი ახალ ხაზზე (KA)</Label>
          <Textarea rows={4} value={arrToLines(section.paragraphs)} onChange={(e) => onChange({ paragraphs: linesToArr(e.target.value) })} />
        </div>
        <div>
          <Label>ტექსტი — თითო აბზაცი ახალ ხაზზე (EN)</Label>
          <Textarea rows={4} value={arrToLines(section.paragraphsEn)} onChange={(e) => onChange({ paragraphsEn: linesToArr(e.target.value) })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>სია — არჩევითი, თითო პუნქტი ახალ ხაზზე (KA)</Label>
          <Textarea rows={3} value={arrToLines(section.list)} onChange={(e) => onChange({ list: linesToArr(e.target.value) })} />
        </div>
        <div>
          <Label>სია — არჩევითი, თითო პუნქტი ახალ ხაზზე (EN)</Label>
          <Textarea rows={3} value={arrToLines(section.listEn)} onChange={(e) => onChange({ listEn: linesToArr(e.target.value) })} />
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
        <Trash2 className="mr-2 h-4 w-4 text-destructive" /> სექციის წაშლა
      </Button>
    </div>
  )
}

function SourceEditor({
  source, onChange, onRemove,
}: { source: GuideSource; onChange: (patch: Partial<GuideSource>) => void; onRemove: () => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
      <div>
        <Label>წყარო (KA)</Label>
        <Input value={source.label} onChange={(e) => onChange({ label: e.target.value })} />
      </div>
      <div>
        <Label>წყარო (EN)</Label>
        <Input value={source.labelEn ?? ""} onChange={(e) => onChange({ labelEn: e.target.value })} />
      </div>
      <div>
        <Label>URL</Label>
        <Input value={source.url} onChange={(e) => onChange({ url: e.target.value })} />
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}

export function GuidesForm() {
  const [items, setItems] = useState<GuideItem[]>([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/cms/guides").then((r) => r.json()).then(({ data }) => { if (data?.items) setItems(data.items) })
  }, [])

  function update(i: number, patch: Partial<GuideItem>) {
    setItems((p) => p.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  }

  async function save() {
    setSaving(true); setMsg("")
    await fetch("/api/admin/cms/guides", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map((it, i) => ({ ...it, order: i })) }),
    })
    setMsg("შენახულია"); setSaving(false)
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">გზამკვლევები</h2>
        <p className="text-sm text-muted-foreground">
          თითოეული გზამკვლევი ცალკე გვერდად ქვეყნდება — /guides/&lt;slug&gt;. slug უნდა იყოს ლათინური, დეფისებით (მაგ. binis-qiravnoba).
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item._id} className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center justify-between p-3 text-left"
              onClick={() => setOpen(open === item._id ? null : item._id)}
            >
              <span className="truncate text-sm font-medium">{item.title || `გზამკვლევი ${i + 1}`}</span>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs", item.status === "published" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground")}>
                  {item.status}
                </span>
                {open === item._id ? <ChevronUp className="h-4 w-4 text-gold" /> : <ChevronDown className="h-4 w-4 text-gold" />}
              </div>
            </button>
            {open === item._id && (
              <div className="space-y-4 border-t p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input value={item.slug} onChange={(e) => update(i, { slug: e.target.value })} placeholder="magaliti-tema" />
                  </div>
                  <div>
                    <Label>სტატუსი</Label>
                    <select
                      value={item.status}
                      onChange={(e) => update(i, { status: e.target.value as GuideItem["status"] })}
                      className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                      <option value="hidden">hidden</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>სათაური (KA)</Label>
                    <Input value={item.title} onChange={(e) => update(i, { title: e.target.value })} />
                  </div>
                  <div>
                    <Label>სათაური (EN)</Label>
                    <Input value={item.titleEn ?? ""} onChange={(e) => update(i, { titleEn: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>მოკლე აღწერა (KA)</Label>
                    <Textarea rows={2} value={item.description} onChange={(e) => update(i, { description: e.target.value })} />
                  </div>
                  <div>
                    <Label>მოკლე აღწერა (EN)</Label>
                    <Textarea rows={2} value={item.descriptionEn ?? ""} onChange={(e) => update(i, { descriptionEn: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>საკვანძო სიტყვები, მძიმით გამოყოფილი (KA)</Label>
                    <Input
                      value={item.keywords.join(", ")}
                      onChange={(e) => update(i, { keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    />
                  </div>
                  <div>
                    <Label>საკვანძო სიტყვები, მძიმით გამოყოფილი (EN)</Label>
                    <Input
                      value={(item.keywordsEn ?? []).join(", ")}
                      onChange={(e) => update(i, { keywordsEn: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>შესავალი (KA)</Label>
                    <Textarea rows={3} value={item.intro} onChange={(e) => update(i, { intro: e.target.value })} />
                  </div>
                  <div>
                    <Label>შესავალი (EN)</Label>
                    <Textarea rows={3} value={item.introEn ?? ""} onChange={(e) => update(i, { introEn: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>სექციები</Label>
                  {item.sections.map((section, si) => (
                    <SectionEditor
                      key={si}
                      section={section}
                      onChange={(patch) => update(i, { sections: item.sections.map((s, j) => (j === si ? { ...s, ...patch } : s)) })}
                      onRemove={() => update(i, { sections: item.sections.filter((_, j) => j !== si) })}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => update(i, { sections: [...item.sections, newSection()] })}>
                    <Plus className="mr-2 h-4 w-4 text-gold" /> სექციის დამატება
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>წყაროები</Label>
                  {item.sources.map((source, so) => (
                    <SourceEditor
                      key={so}
                      source={source}
                      onChange={(patch) => update(i, { sources: item.sources.map((s, j) => (j === so ? { ...s, ...patch } : s)) })}
                      onRemove={() => update(i, { sources: item.sources.filter((_, j) => j !== so) })}
                    />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => update(i, { sources: [...item.sources, newSource()] })}>
                    <Plus className="mr-2 h-4 w-4 text-gold" /> წყაროს დამატება
                  </Button>
                </div>

                <Button type="button" variant="ghost" onClick={() => setItems((p) => p.filter((_, j) => j !== i))}>
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" /> გზამკვლევის წაშლა
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, newGuide(p.length)])}>
        <Plus className="mr-2 h-4 w-4 text-gold" /> გზამკვლევის დამატება
      </Button>
      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          შენახვა
        </Button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </div>
    </div>
  )
}
