import { NextResponse } from "next/server";
import { appUrl } from "@/lib/flitt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Flitt's `response_url` bounce target. Flitt may return the customer's
 * browser here via HTTPS POST *or* GET (docs.flitt.com/api/payment-flow) —
 * either way this is a cross-site top-level navigation, so the
 * SameSite=Lax session cookie is only guaranteed to ride along on GET.
 * Redirecting here (303, so a POST becomes a GET) before landing on the
 * auth-protected /billing page keeps that hop same-site, where the cookie
 * is always sent regardless of what Flitt used to get here.
 */
function bounce() {
  return NextResponse.redirect(new URL("/billing?status=success", appUrl()), 303);
}

export async function GET() {
  return bounce();
}

export async function POST() {
  return bounce();
}
