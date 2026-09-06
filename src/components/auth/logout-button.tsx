import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action="/api/logout" method="post">
      <Button type="submit" variant="ghost" size="xs">
        <LogOut className="mr-1.5 h-3.5 w-3.5 text-gold" />
        გასვლა
      </Button>
    </form>
  );
}
