"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Cancels the active Flitt subscription via /api/subscription/cancel. */
export function CancelSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const cancel = async () => {
    if (loading) return;
    if (!confirm("ნამდვილად გსურს სუბსკრიფციის გაუქმება?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "გაუქმება ვერ მოხერხდა.");
        return;
      }
      toast.success("სუბსკრიფცია გაუქმდა.");
      router.refresh();
    } catch {
      toast.error("სერვისთან კავშირი ვერ დამყარდა.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={cancel} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "სუბსკრიფციის გაუქმება"}
    </Button>
  );
}
