import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export function SubPageHeader({
  backHref,
  icon,
  title,
  subtitle,
}: {
  backHref: string
  icon?: ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <Link href={backHref} className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4 text-gold" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="h-1 w-12 rounded-full bg-gradient-to-r from-primary to-gold mt-4 ml-12" />
    </div>
  )
}
