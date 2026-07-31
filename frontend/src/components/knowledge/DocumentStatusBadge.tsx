import { CheckCircle2, Loader2, ScanLine, XCircle } from "lucide-react"
import { Badge, type badgeVariants } from "../ui/Badge"
import type { VariantProps } from "class-variance-authority"
import type { Document } from "../../types"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

const STATUS_CONFIG: Record<
  Document["status"],
  { label: string; icon: typeof CheckCircle2; variant: BadgeVariant; spin?: boolean }
> = {
  processed: { label: "Ready", icon: CheckCircle2, variant: "success" },
  parsing: { label: "Parsing", icon: Loader2, variant: "warning", spin: true },
  ocr_engaged: { label: "OCR", icon: ScanLine, variant: "info" },
}

export function DocumentStatusBadge({ status }: { status: Document["status"] | "failed" }) {
  if (status === "failed") {
    return (
      <Badge variant="danger">
        <XCircle className="w-3 h-3" />
        Failed
      </Badge>
    )
  }

  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant}>
      <Icon className={`w-3 h-3 ${config.spin ? "animate-spin" : ""}`} />
      {config.label}
    </Badge>
  )
}
