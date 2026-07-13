"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  THEME_TOKENS,
  TOKEN_GROUPS,
  FONT_CHOICES,
  DEFAULT_LIGHT,
  DEFAULT_DARK,
  DEFAULT_THEME,
  type FontChoice,
  type ThemeConfigData,
} from "@/lib/theme-tokens"

const TOKEN_LABEL: Record<string, string> = Object.fromEntries(THEME_TOKENS.map((t) => [t.key, t.label]))

/** One color swatch + hex input, labeled with what it actually controls. */
function ColorField({
  tokenKey,
  value,
  onChange,
}: {
  tokenKey: string
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-9 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
        aria-label={TOKEN_LABEL[tokenKey] ?? tokenKey}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs text-muted-foreground">{TOKEN_LABEL[tokenKey] ?? tokenKey}</div>
        <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-7 font-mono text-xs" />
      </div>
    </div>
  )
}

/** Live-rendered sample using the exact tokens the group controls, so it's obvious what changes. */
function GroupPreview({
  type,
  keys,
  tokens,
  radius,
  sampleLabel,
}: {
  type: (typeof TOKEN_GROUPS)[number]["previewType"]
  keys: string[]
  tokens: Record<string, string>
  radius: string
  sampleLabel?: string
}) {
  const r = { borderRadius: radius }

  if (type === "bg-text")
    return (
      <div className="flex h-full min-h-20 flex-col justify-center gap-1 rounded-md border p-3" style={{ background: tokens[keys[0]], ...r }}>
        <p className="text-sm font-medium" style={{ color: tokens[keys[1]] }}>ასეთი ტექსტი ჩანს გვერდზე</p>
        <p className="text-xs" style={{ color: tokens[keys[1]], opacity: 0.7 }}>მაგალითი აბზაცი</p>
      </div>
    )

  if (type === "button")
    return (
      <div className="flex h-full min-h-20 items-center justify-center rounded-md border p-3">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium"
          style={{ background: tokens[keys[0]], color: tokens[keys[1]], ...r }}
        >
          {sampleLabel}
        </button>
      </div>
    )

  if (type === "badge")
    return (
      <div className="flex h-full min-h-20 items-center justify-center rounded-md border p-3">
        <span
          className="px-3 py-1 text-xs font-semibold"
          style={{ background: tokens.accent, color: tokens["accent-foreground"], borderRadius: radius }}
        >
          {sampleLabel}
        </span>
      </div>
    )

  if (type === "muted")
    return (
      <div className="flex h-full min-h-20 flex-col justify-center gap-1 rounded-md border p-3" style={{ background: tokens[keys[0]], ...r }}>
        <p className="text-sm" style={{ color: tokens[keys[1]] }}>დამატებითი, ნაკლებად მნიშვნელოვანი ტექსტი ასე გამოიყურება</p>
      </div>
    )

  if (type === "card")
    return (
      <div className="flex h-full min-h-20 items-center rounded-md border p-3">
        <div className="w-full rounded-md border p-3" style={{ background: tokens[keys[0]], color: tokens[keys[1]], borderColor: tokens.border, ...r }}>
          <p className="text-sm font-semibold">ბარათის სათაური</p>
          <p className="text-xs opacity-70">ბარათის ტექსტის მაგალითი</p>
        </div>
      </div>
    )

  if (type === "border")
    return (
      <div className="flex h-full min-h-20 flex-col items-center justify-center gap-2 rounded-md border p-3">
        <div
          className="w-full rounded-md px-3 py-2 text-xs text-muted-foreground"
          style={{ border: `1px solid ${tokens.input}`, borderRadius: radius }}
        >
          ინფუთის ველის მაგალითი
        </div>
        <div
          className="w-full rounded-md px-3 py-2 text-xs text-muted-foreground"
          style={{ border: `1px solid ${tokens.border}`, boxShadow: `0 0 0 3px ${tokens.ring}55`, borderRadius: radius }}
        >
          ფოკუსის რგოლის მაგალითი
        </div>
      </div>
    )

  return (
    <div className="flex h-full min-h-20 items-center justify-center rounded-md border p-3">
      <button
        type="button"
        className="px-4 py-2 text-sm font-medium text-white"
        style={{ background: tokens.destructive, ...r }}
      >
        {sampleLabel}
      </button>
    </div>
  )
}

function ColorGroups({
  tokens,
  radius,
  onChange,
}: {
  tokens: Record<string, string>
  radius: string
  onChange: (key: string, val: string) => void
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {TOKEN_GROUPS.map((g) => (
        <div key={g.title} className="rounded-lg border p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold">{g.title}</div>
            <div className="text-xs text-muted-foreground">{g.description}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              {g.keys.map((k) => (
                <ColorField key={k} tokenKey={k} value={tokens[k]} onChange={(v) => onChange(k, v)} />
              ))}
            </div>
            <GroupPreview type={g.previewType} keys={g.keys} tokens={tokens} radius={radius} sampleLabel={g.sampleLabel} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ThemePanel() {
  const [cfg, setCfg] = useState<ThemeConfigData>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/cms/theme")
      .then((r) => r.json())
      .then(({ data }) => {
        if (data) setCfg(data)
      })
      .finally(() => setLoading(false))
  }, [])

  function setToken(mode: "light" | "dark", key: string, val: string) {
    setCfg((p) => ({ ...p, [mode]: { ...p[mode], [key]: val } }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/cms/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      })
      if (!res.ok) {
        toast.error("შენახვა ვერ მოხერხდა")
        return
      }
      const { data } = await res.json()
      if (data) setCfg(data)
      toast.success("თემა შენახულია — განახლდება გადატვირთვისას")
    } catch {
      toast.error("ქსელის შეცდომა")
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> იტვირთება…
      </div>
    )

  const radiusNum = parseFloat(cfg.radius) || 0.625

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">თემა და ტიპოგრაფია</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            თითოეულ ველთან ჩანს, ზუსტად სად გამოჩნდება ის ფერი საიტზე — ცვლილება მაშინვე აისახება მაგალითში.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCfg({ ...DEFAULT_THEME, light: { ...DEFAULT_LIGHT }, dark: { ...DEFAULT_DARK } })}
        >
          <RotateCcw className="mr-2 h-4 w-4" /> ნაგულისხმევზე დაბრუნება
        </Button>
      </div>

      {/* Typography */}
      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div>
          <Label>ფონტი</Label>
          <select
            value={cfg.fontFamily}
            onChange={(e) => setCfg((p) => ({ ...p, fontFamily: e.target.value as FontChoice }))}
            className="mt-1 h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          >
            {FONT_CHOICES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>ტექსტის ზომა: {cfg.baseFontSize}px</Label>
          <input
            type="range"
            min={12}
            max={22}
            step={1}
            value={cfg.baseFontSize}
            onChange={(e) => setCfg((p) => ({ ...p, baseFontSize: Number(e.target.value) }))}
            className="mt-3 w-full"
          />
        </div>
        <div>
          <Label>კუთხის მომრგვალება: {radiusNum}rem</Label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.125}
            value={radiusNum}
            onChange={(e) => setCfg((p) => ({ ...p, radius: `${e.target.value}rem` }))}
            className="mt-3 w-full"
          />
        </div>
      </div>

      {/* Colors */}
      <Tabs defaultValue="light">
        <TabsList>
          <TabsTrigger value="light">ღია რეჟიმი</TabsTrigger>
          <TabsTrigger value="dark">მუქი რეჟიმი</TabsTrigger>
        </TabsList>
        <TabsContent value="light" className="mt-4">
          <ColorGroups tokens={cfg.light} radius={cfg.radius} onChange={(k, v) => setToken("light", k, v)} />
        </TabsContent>
        <TabsContent value="dark" className="mt-4">
          <ColorGroups tokens={cfg.dark} radius={cfg.radius} onChange={(k, v) => setToken("dark", k, v)} />
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 flex justify-end border-t bg-background py-3">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          შენახვა
        </Button>
      </div>
    </div>
  )
}
