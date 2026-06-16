import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { CheckoutSchema } from "@/lib/validators";
import { createSubscriptionCheckout } from "@/lib/flitt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { plan } = parsed.data;

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { checkoutUrl, orderId, paymentId } = await createSubscriptionCheckout(plan, {
      id: String(user._id),
      email: user.email,
      name: user.name,
    });
    // Persist the pending order so the callback can be cross-checked.
    await User.findByIdAndUpdate(user._id, {
      flittOrderId: orderId,
      flittPaymentId: paymentId ?? "",
      subscriptionStatus: "pending",
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    return NextResponse.json(
      { error: "Payment provider error", detail: String(err instanceof Error ? err.message : err) },
      { status: 502 }
    );
  }
}
