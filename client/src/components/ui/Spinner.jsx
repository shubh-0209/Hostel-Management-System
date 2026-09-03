import * as React from "react"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

export function Spinner({ className, ...props }) {
  return (
    <Loader2 
      className={cn("h-4 w-4 animate-spin text-muted-foreground", className)} 
      {...props} 
    />
  )
}
