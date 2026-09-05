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
 * auth-protected dashboard keeps that hop same-site, where the cookie is
 * always sent regardless of what Flitt used to get here.
 *
 * The result is only used for the billing-tab feedback banner — the real
 * status change (quota grant / plan activation) happens exclusively on the
 * server_callback_url (/api/flitt/callback), never here.
 */

/** Map Flitt's order_status/response_status to a simple feedback value. */
function paymentResult(orderStatus?: string, responseStatus?: string): string {
  const s = (orderStatus ?? "").toLowerCase();
  if (s === "approved" && responseStatus !== "failure") return "success";
  if (s === "declined" || s === "expired" || s === "reversed" || responseStatus === "failure") return "declined";
  // approved-pending / other intermediate states
  return "processing";
}

/** Collect Flitt's return params from the POST body (JSON or form) plus any query params. */
async function collectParams(req: Request, url: URL): Promise<Record<string, string>> {
  const params: Record<string, string> = {};
  if (req.method === "POST") {
    const ct = req.headers.get("content-type") ?? "";
    try {
      if (ct.includes("application/json")) {
        const body: unknown = await req.json();
        if (body && typeof body === "object") Object.assign(params, body);
      } else {
        Object.assign(params, Object.fromEntries(new URLSearchParams(await req.text())));
      }
    } catch {
      // fall through to query params below
    }
  }
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });
  return params;
}

function bounce(params: Record<string, string>) {
  const result = paymentResult(params.order_status, params.response_status);
  const target = new URL(`/dashboard?tab=billing&paymentResult=${encodeURIComponent(result)}`, appUrl());
  return NextResponse.redirect(target, 303);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = await collectParams(req, url);
  return bounce(params);
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const params = await collectParams(req, url);
  return bounce(params);
}
