"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "./RichTextEditor"
import { ImageUpload } from "./ImageUpload"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import type { BlogPostData, BlogCategoryData } from "@/types/cms"

interface Props {
  post: BlogPostData | null
  categories: BlogCategoryData[]
  onSave: () => void
  onCancel: () => void
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80)
}

export function BlogPostEditor({ post, categories, onSave, onCancel }: Props) {
  const [data, setData] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    body: post?.body ?? {},
    coverImageUrl: post?.coverImageUrl ?? "",
    coverImagePubId: post?.coverImagePubId ?? "",
    category: post?.category ?? "",
    tags: post?.tags?.join(", ") ?? "",
    author: post?.author ?? "",
  })
  const [saving, setSaving] = useState(false)

  async function save(status: "draft" | "published" | "hidden") {
    setSaving(true)
    const payload = {
      ...data,
      tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      ...(status === "published" && !post?.publishedAt ? { publishedAt: new Date().toISOString() } : {}),
    }
    if (post?._id) {
      await fetch(`/api/admin/cms/blog/posts/${post._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
    } else {
      await fetch("/api/admin/cms/blog/posts", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
    }
    setSaving(false); onSave()
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}><ArrowLeft className="mr-1 h-4 w-4 text-gold" /> უკან</Button>
        <h2 className="text-lg font-semibold">{post ? "პოსტის რედაქტირება" : "ახალი პოსტი"}</h2>
      </div>

      <div>
        <Label>სათაური</Label>
        <Input value={data.title} onChange={(e) => setData((p) => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))} />
      </div>
      <div>
        <Label>Slug</Label>
        <Input value={data.slug} className="font-mono text-sm"
          onChange={(e) => setData((p) => ({ ...p, slug: slugify(e.target.value) }))} />
      </div>
      <div>
        <Label>მოკლე აღწერა (Excerpt)</Label>
        <Textarea value={data.excerpt} rows={2} onChange={(e) => setData((p) => ({ ...p, excerpt: e.target.value }))} />
      </div>
      <div>
        <Label className="mb-2 block">შინაარსი</Label>
        <RichTextEditor value={data.body} onChange={(body) => setData((p) => ({ ...p, body }))} />
      </div>
      <ImageUpload label="Cover Image" value={data.coverImageUrl} pubId={data.coverImagePubId}
        onUpload={(url, pubId) => setData((p) => ({ ...p, coverImageUrl: url, coverImagePubId: pubId }))} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label>კატეგორია</Label>
          <select value={data.category} onChange={(e) => setData((p) => ({ ...p, category: e.target.value }))}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm">
            <option value="">— კატეგორია —</option>
            {categories.filter((c) => c.status === "published").map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>ავტორი</Label>
          <Input value={data.author} onChange={(e) => setData((p) => ({ ...p, author: e.target.value }))} />
        </div>
        <div>
          <Label>Tags (comma-separated)</Label>
          <Input value={data.tags} onChange={(e) => setData((p) => ({ ...p, tags: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => save("draft")} disabled={saving} variant="outline">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4 text-gold" />}Draft
        </Button>
        <Button onClick={() => save("published")} disabled={saving}>გამოქვეყნება</Button>
        <Button onClick={() => save("hidden")} disabled={saving} variant="ghost">დამალვა</Button>
      </div>
    </div>
  )
}
