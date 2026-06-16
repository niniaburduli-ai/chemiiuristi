import Link from "next/link";
import { redirect } from "next/navigation";
import { Calendar, Receipt } from "lucide-react";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/lib/models/user";
import { Payment } from "@/lib/models/payment";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CancelSubscriptionButton } from "@/components/site/cancel-subscription-button";

export const dynamic = "force-dynamic";

const PLAN_INFO: Record<string, { label: string; price: string }> = {
  free: { label: "უფასო", price: "0 ₾" },
  standard: { label: "სტანდარტული", price: "19 ₾ / თვე" },
  premium: { label: "პრემიუმ", price: "99 ₾ / თვე" },
};

const STATUS_LABEL: Record<string, string> = {
  active: "აქტიური",
  pending: "მუშავდება",
  canceled: "გაუქმებული",
  declined: "უარყოფილი",
  expired: "ვადაგასული",
  reversed: "დაბრუნებული",
};

const fmtDate = (d?: Date | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "—";
const fmtAmount = (minor: number, currency = "GEL") =>
  `${(minor / 100).toFixed(2)} ${currency === "GEL" ? "₾" : currency}`;

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/billing");

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  if (!user) redirect("/login");

  const plan = (user.plan ?? "free") as keyof typeof PLAN_INFO;
  const info = PLAN_INFO[plan] ?? PLAN_INFO.free;
  const isPaid = plan !== "free";
  const status = user.subscriptionStatus || (isPaid ? "active" : "");

  const payments = await Payment.find({ userId: session.user.id })
    .sort({ paidAt: -1 })
    .limit(50)
    .lean();

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">ბილინგი</h1>
      <p className="text-muted-foreground mb-8">
        გადახდის მართვა და გადახდების ისტორია
      </p>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <CardTitle>მიმდინარე გეგმა</CardTitle>
              <CardDescription>
                {isPaid ? "აქტიური სუბსკრიფცია" : "უფასო გეგმა"}
              </CardDescription>
            </div>
            {status && (
              <Badge variant={status === "active" ? "default" : "secondary"}>
                {STATUS_LABEL[status] ?? status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{info.label}</span>
            <span className="text-muted-foreground">— {info.price}</span>
          </div>
          {isPaid && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              შემდეგი გადახდა: {fmtDate(user.resetAt)}
            </div>
          )}
          <div className="mt-6 flex gap-2 flex-wrap">
            <Link href="/pricing" className={buttonVariants()}>
              {isPaid ? "გეგმის შეცვლა" : "გეგმის არჩევა"}
            </Link>
            {isPaid && status !== "canceled" && <CancelSubscriptionButton />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>გადახდების ისტორია</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Receipt className="h-4 w-4" />
              გადახდები ჯერ არ არის.
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p, i) => {
                const id = String((p as { _id: unknown })._id);
                return (
                  <div key={id}>
                    <div className="flex items-center justify-between py-2 flex-wrap gap-2">
                      <div>
                        <div className="font-medium text-sm">
                          {PLAN_INFO[p.plan]?.label ?? p.plan}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fmtDate(p.paidAt as Date)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{fmtAmount(p.amount, p.currency)}</span>
                        <Badge variant="secondary">
                          {STATUS_LABEL[p.status ?? "approved"] ?? "გადახდილი"}
                        </Badge>
                      </div>
                    </div>
                    {i < payments.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
