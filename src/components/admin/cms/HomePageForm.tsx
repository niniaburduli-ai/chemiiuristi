"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "./ImageUpload"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import type { HomePageData } from "@/types/cms"

const EMPTY: HomePageData = {
  hero: { title: "", subtitle: "", ctaText: "", ctaHref: "", imageUrl: "", imagePubId: "" },
  stats: [{ label: "", value: "" }, { label: "", value: "" }, { label: "", value: "" }, { label: "", value: "" }],
  features: [], services: [],
  ctaSection: { title: "", subtitle: "", buttonText: "", buttonHref: "" },
  status: "draft",
}

export function HomePageForm() {
  const [data, setData] = useState<HomePageData>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    fetch("/api/admin/cms/homepage").then((r) => r.json()).then(({ data: d }) => { if (d?._id) setData({ ...EMPTY, ...d }) })
  }, [])

  async function save(status: HomePageData["status"]) {
    setSaving(true); setMsg("")
    await fetch("/api/admin/cms/homepage", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, status }),
    })
    setData((p) => ({ ...p, status })); setMsg("შენახულია"); setSaving(false)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <h2 className="text-lg font-semibold">მთავარი გვერდი</h2>

      {/* Hero */}
      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium">Hero სექცია</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["title", "subtitle", "ctaText", "ctaHref"] as const).map((k) => (
            <div key={k}>
              <Label>{k}</Label>
              <Input value={data.hero[k]} onChange={(e) => setData((p) => ({ ...p, hero: { ...p.hero, [k]: e.target.value } }))} />
            </div>
          ))}
        </div>
        <ImageUpload label="Hero Image" value={data.hero.imageUrl} pubId={data.hero.imagePubId}
          onUpload={(url, pubId) => setData((p) => ({ ...p, hero: { ...p.hero, imageUrl: url, imagePubId: pubId } }))} />
      </section>

      {/* Stats */}
      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium">სტატისტიკა</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.stats.map((s, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Label</Label>
                <Input value={s.label} onChange={(e) => setData((p) => { const stats = [...p.stats]; stats[i] = { ...stats[i], label: e.target.value }; return { ...p, stats } })} />
              </div>
              <div className="w-24">
                <Label className="text-xs">Value</Label>
                <Input value={s.value} onChange={(e) => setData((p) => { const stats = [...p.stats]; stats[i] = { ...stats[i], value: e.target.value }; return { ...p, stats } })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Features</h3>
          <Button type="button" size="sm" variant="outline" onClick={() =>
            setData((p) => ({ ...p, features: [...p.features, { _id: crypto.randomUUID(), title: "", body: "", icon: "", order: p.features.length }] }))
          }><Plus className="mr-1 h-3 w-3" /> Add</Button>
        </div>
        {data.features.map((f, i) => (
          <div key={f._id} className="flex gap-2 rounded border p-3">
            <div className="flex-1 space-y-2">
              <Input placeholder="Title" value={f.title} onChange={(e) => setData((p) => { const features = [...p.features]; features[i] = { ...features[i], title: e.target.value }; return { ...p, features } })} />
              <Input placeholder="Icon (lucide name)" value={f.icon} onChange={(e) => setData((p) => { const features = [...p.features]; features[i] = { ...features[i], icon: e.target.value }; return { ...p, features } })} />
              <Textarea placeholder="Description" value={f.body} rows={2} onChange={(e) => setData((p) => { const features = [...p.features]; features[i] = { ...features[i], body: e.target.value }; return { ...p, features } })} />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setData((p) => ({ ...p, features: p.features.filter((_, j) => j !== i) }))}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="space-y-3 rounded-lg border p-4">
        <h3 className="font-medium">CTA სექცია</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["title", "subtitle", "buttonText", "buttonHref"] as const).map((k) => (
            <div key={k}>
              <Label>{k}</Label>
              <Input value={data.ctaSection[k]} onChange={(e) => setData((p) => ({ ...p, ctaSection: { ...p.ctaSection, [k]: e.target.value } }))} />
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={() => save("draft")} disabled={saving} variant="outline">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Draft
        </Button>
        <Button onClick={() => save("published")} disabled={saving}>გამოქვეყნება</Button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
        <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-medium bg-muted">{data.status}</span>
      </div>
    </div>
  )
}
