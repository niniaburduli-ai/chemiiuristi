import { dbConnect } from "@/lib/db";
import { Feedback } from "@/lib/models/Feedback";

export type FeedbackSummary = { percentage: number; avgRating: number; count: number };

export type ApprovedFeedback = {
  id: string;
  initials: string;
  rating: number | null;
  message: string;
  createdAt: string | null;
};

const INITIAL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** A submitter who wasn't logged in has no name to derive from — a stable,
 * id-derived pair of letters gives their card a visual identity without
 * implying a real one. Deterministic so it doesn't change across reloads. */
function initialsFromId(id: string): string {
  const a = id.charCodeAt(id.length - 4) % INITIAL_LETTERS.length;
  const b = id.charCodeAt(id.length - 1) % INITIAL_LETTERS.length;
  return `${INITIAL_LETTERS[a]}.${INITIAL_LETTERS[b]}.`;
}

/** Real initials from the logged-in submitter's name, e.g. "Nino Burduli" -> "N.B." */
function initialsFromName(name: string): string | null {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return `${first.toUpperCase()}.${last.toUpperCase()}.`;
}

/** Admin-approved testimonials for the public homepage section. */
export async function getApprovedFeedback(limit = 24): Promise<ApprovedFeedback[]> {
  try {
    await dbConnect();
    const items = await Feedback.find({ isApproved: true, message: { $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return items.map((f) => {
      const id = String((f as { _id: unknown })._id);
      return {
        id,
        initials: (f.userName && initialsFromName(f.userName)) || initialsFromId(id),
        rating: f.rating ?? null,
        message: f.message ?? "",
        createdAt: (f as { createdAt?: Date }).createdAt?.toISOString() ?? null,
      };
    });
  } catch {
    return [];
  }
}

const ZERO: FeedbackSummary = { percentage: 0, avgRating: 0, count: 0 };

/** Live satisfaction percentage + avg rating (out of 5) for the homepage review card and stats. */
export async function getFeedbackSummary(): Promise<FeedbackSummary> {
  try {
    await dbConnect();
    const [agg] = await Feedback.aggregate<{ avg: number; count: number }>([
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    if (!agg || agg.count === 0) return ZERO;
    return {
      percentage: Math.round((agg.avg / 5) * 100),
      avgRating: Math.round(agg.avg * 10) / 10,
      count: agg.count,
    };
  } catch {
    return ZERO;
  }
}
