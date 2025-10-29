import { Badge } from "@/components/ui/badge"

interface TransactionTypeBadgeProps {
  rawType: string
  direction: string
}

export function TransactionTypeBadge({ rawType, direction }: TransactionTypeBadgeProps) {
  if (rawType === "deposit" || direction === "in") {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Depósito
      </Badge>
    )
  } else if (rawType === "withdrawal" || direction === "out") {
    return (
      <Badge variant="default" className="bg-blue-100 text-blue-800">
        Retiro
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline">
        {rawType === "deposit" ? "Depósito" : rawType === "withdrawal" ? "Retiro" : "Otro"}
      </Badge>
    )
  }
}