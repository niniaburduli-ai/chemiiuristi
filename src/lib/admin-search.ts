import { User } from "@/lib/models/user"

/** Builds a Mongo filter for a free-text admin search: regex match across the
 * collection's own text fields, OR'd with a match against the referenced
 * owner's name/email (`ownerField`) — owner name/email is only populated for
 * display, so it isn't a field on the doc itself and needs a separate lookup. */
export async function buildSearchFilter(
  q: string | undefined,
  ownFields: string[],
  ownerField?: string
): Promise<Record<string, unknown>> {
  if (!q) return {}
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = { $regex: escaped, $options: "i" }
  const or: Record<string, unknown>[] = ownFields.map((f) => ({ [f]: regex }))

  if (ownerField) {
    const owners = await User.find({ $or: [{ name: regex }, { email: regex }] })
      .select("_id")
      .lean()
    if (owners.length) {
      or.push({ [ownerField]: { $in: owners.map((o) => o._id) } })
    }
  }

  return { $or: or }
}
