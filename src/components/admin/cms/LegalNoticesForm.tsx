"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "./RichTextEditor"
import { Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LegalNoticeData, LegalNoticeType } from "@/types/cms"

const TYPES: { id: LegalNoticeType; label: string }[] = [
  { id: "ai-warning", label: "AI გაფრთხილება" },
  { id: "terms", label: "გამოყენების პირობები" },
  { id: "privacy", label: "კონფიდენციალობა" },
  { id: "cookie", label: "Cookie პოლიტიკა" },
]

function emptyNotice(type: LegalNoticeType): LegalNoticeData {
  return { _id: "", type, title: "", body: {}, status: "draft", publishedAt: null }
}

export function LegalNoticesForm() {
  const [active, setActive] = useState<LegalNoticeType>("ai-warning")
  const [notices, setNotices] = useState<Record<LegalNoticeType, LegalNoticeData>>({
    "ai-warning": emptyNotice("ai-warning"),
    terms: emptyNotice("terms"),
    privacy: emptyNotice("privacy"),
    cookie: emptyNotice("cookie"),
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    fetch("/api/admin/cms/legal")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ items }: { items: LegalNoticeData[] }) => {
        if (!items) return
        setNotices((p) => {
          const next = { ...p }
          for (const item of items) next[item.type as LegalNoticeType] = item
          return next
        })
      })
      .catch(() => {})
  }, [])

  const notice = notices[active]

  function updateNotice(patch: Partial<LegalNoticeData>) {
    setNotices((p) => ({ ...p, [active]: { ...p[active], ...patch } }))
  }

  async function save(status: LegalNoticeData["status"]) {
    setSaving(true); setMsg("")
    try {
      const res = await fetch("/api/admin/cms/legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...notice, status, ...(status === "published" ? { publishedAt: new Date().toISOString() } : {}) }),
      })
      const json = await res.json()
      if (json.data) setNotices((p) => ({ ...p, [active]: json.data }))
      setMsg(res.ok ? "შენახულია" : (json.error ?? "შეცდომა"))
    } catch {
      setMsg("შეცდომა")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-lg font-semibold">სამართლებრივი შენიშვნები</h2>
      <div className="flex gap-2 flex-wrap">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setActive(t.id); setMsg("") }}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}
          >
            {t.label}
            {notices[t.id].status === "published" && <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />}
          </button>
        ))}
      </div>

      <div>
        <Label>სათაური</Label>
        <Input value={notice.title} onChange={(e) => updateNotice({ title: e.target.value })} />
      </div>
      <div>
        <Label className="mb-2 block">შინაარსი</Label>
        <RichTextEditor value={notice.body} onChange={(body) => updateNotice({ body })} />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => save("draft")} disabled={saving} variant="outline">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Draft
        </Button>
        <Button onClick={() => save("published")} disabled={saving}>გამოქვეყნება</Button>
        <Button onClick={() => save("hidden")} disabled={saving} variant="ghost">დამალვა</Button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
        <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium bg-muted">{notice.status}</span>
      </div>
    </div>
  )
}
