"use client"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { useEffect } from "react"
import { cn } from "@/lib/utils"

interface Props {
  value: object
  onChange: (json: object) => void
  placeholder?: string
  className?: string
}

const toolbar = [
  { label: "B", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBold().run(), mark: "bold" },
  { label: "I", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleItalic().run(), mark: "italic" },
  { label: "H2", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 2 }).run(), mark: "heading" },
  { label: "H3", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 3 }).run(), mark: "heading3" },
  { label: "•", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBulletList().run(), mark: "bulletList" },
  { label: "1.", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleOrderedList().run(), mark: "orderedList" },
  { label: "❝", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBlockquote().run(), mark: "blockquote" },
  { label: "—", action: (e: ReturnType<typeof useEditor>) => e?.chain().focus().setHorizontalRule().run(), mark: "hr" },
]

export function RichTextEditor({ value, onChange, placeholder = "Start typing...", className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value && Object.keys(value).length > 0 ? value : undefined,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  })

  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(value)
    if (current !== next && Object.keys(value ?? {}).length > 0) {
      editor.commands.setContent(value)
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="flex flex-wrap gap-1 border-b p-2">
        {toolbar.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); btn.action(editor) }}
            className={cn(
              "rounded px-2 py-0.5 text-sm font-medium hover:bg-muted",
              editor?.isActive(btn.mark) && "bg-muted font-bold"
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 focus-within:outline-none [&_.ProseMirror]:min-h-32 [&_.ProseMirror]:outline-none"
      />
    </div>
  )
}
