import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { paymentStatusInfo } from "@/lib/payment-status"

export default function PaymentStatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  const info = paymentStatusInfo(status)
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", info.className, className)}>
      {info.label}
    </Badge>
  )
}
