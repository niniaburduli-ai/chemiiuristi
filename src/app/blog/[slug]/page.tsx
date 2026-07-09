import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import LinkExt from "@tiptap/extension-link"
import ImageExt from "@tiptap/extension-image"
import type { JSONContent } from "@tiptap/core"
import { getBlogPost } from "@/lib/cms"
import { PageHero } from "@/components/site/PageHero"
import { JsonLd } from "@/components/site/JsonLd"
import { buildMetadata, articleJsonLd, breadcrumbJsonLd } from "@/lib/seo"

const TIPTAP_EXTENSIONS = [StarterKit, LinkExt, ImageExt]

function isRenderableDoc(body: unknown): body is JSONContent {
  return (
    !!body &&
    typeof body === "object" &&
    (body as JSONContent).type === "doc" &&
    Array.isArray((body as JSONContent).content) &&
    (body as JSONContent).content!.length > 0
  )
}

function bodyToHtml(body: unknown): string {
  if (!isRenderableDoc(body)) return ""
  try {
    return generateHTML(body, TIPTAP_EXTENSIONS)
  } catch {
    return ""
  }
}

/** Plain-text preview from the rich-text body, for meta description fallback. */
function stripHtml(html: string, max = 160): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) {
    return buildMetadata({
      title: "პოსტი ვერ მოიძებნა",
      description: "მოთხოვნილი ბლოგპოსტი არ არსებობს.",
      path: `/blog/${slug}`,
      noindex: true,
    })
  }
  const description = post.excerpt?.trim() || stripHtml(bodyToHtml(post.body)) || "სამართლებრივი სტატია — ჩემი იურისტი."
  return buildMetadata({
    title: post.title,
    description,
    path: `/blog/${post.slug}`,
    type: "article",
    image: post.coverImageUrl || undefined,
    publishedTime: post.publishedAt || undefined,
    keywords: [...(post.tags ?? []), "იურიდიული რჩევები", "სამართლებრივი რჩევა"],
  })
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const html = bodyToHtml(post.body)
  const description = post.excerpt?.trim() || stripHtml(html)
  const published = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("ka-GE", { year: "numeric", month: "long", day: "numeric" })
    : null

  return (
    <div>
      <JsonLd
        data={[
          articleJsonLd({
            title: post.title,
            description,
            path: `/blog/${post.slug}`,
            image: post.coverImageUrl || undefined,
            datePublished: post.publishedAt,
            dateModified: post.publishedAt,
            author: post.author || undefined,
          }),
          breadcrumbJsonLd([
            { name: "მთავარი", path: "/" },
            { name: "ბლოგი", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <PageHero title={post.title} subtitle={post.excerpt || undefined} />

      <article className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:gap-2.5 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> ბლოგი
          </Link>
          {(published || post.author) && (
            <div className="flex items-center gap-2">
              {post.author && <span>{post.author}</span>}
              {published && post.author && <span aria-hidden>·</span>}
              {published && <time dateTime={post.publishedAt ?? undefined}>{published}</time>}
            </div>
          )}
        </div>

        {post.coverImageUrl && (
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {html ? (
          <div
            className="text-foreground leading-relaxed
              [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold
              [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-bold
              [&_p]:mb-4 [&_p]:leading-relaxed
              [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6
              [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6
              [&_li]:mb-1
              [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
              [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
              [&_hr]:my-8 [&_hr]:border-border
              [&_img]:my-6 [&_img]:rounded-xl
              [&_strong]:font-bold"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          post.excerpt && <p className="text-lg leading-relaxed text-foreground">{post.excerpt}</p>
        )}

        {post.tags?.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
