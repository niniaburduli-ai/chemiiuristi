import type { Metadata } from "next";
import { getPublishedBlogPosts } from "@/lib/cms";
import { getLocale } from "@/lib/i18n/locale";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ბლოგი | ჩემი იურისტი",
  description: "სამართლებრივი სიახლეები და სტატიები",
};

export default async function BlogPage() {
  const locale = await getLocale();
  const posts = await getPublishedBlogPosts(locale);

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">ბლოგი</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">პოსტები არ არის.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post._id?.toString()} className="border-b pb-6">
              <Link
                href={`/blog/${post.slug}`}
                className="text-lg font-semibold hover:text-primary transition-colors"
              >
                {post.title}
              </Link>
              {post.excerpt && (
                <p className="mt-1 text-sm text-muted-foreground">{post.excerpt}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
