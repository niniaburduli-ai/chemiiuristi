/** Renders a JSON-LD structured-data block. Server-safe. */
export function JsonLd({ data }: { data: object | object[] | null }) {
  if (!data) return null
  const arr = Array.isArray(data) ? data : [data]
  return (
    <>
      {arr.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  )
}
