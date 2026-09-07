import { cloneElement, createContext, useContext, type HTMLAttributes, type ReactElement, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type SheetContextValue = {
  onOpenChange?: (open: boolean) => void
}

const SheetContext = createContext<SheetContextValue>({})

type SheetProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
}

function Sheet({ open = false, onOpenChange, children }: SheetProps) {
  if (!open) return null
  return <SheetContext.Provider value={{ onOpenChange }}>{children}</SheetContext.Provider>
}

type SheetContentProps = HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left"
  children: ReactNode
}

function SheetContent({ className, side = "right", children, ...props }: SheetContentProps) {
  const { onOpenChange } = useContext(SheetContext)
  return (
    <div className="fixed inset-0 z-50 flex bg-black/45" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange?.(false) }}>
      <div
        role="dialog"
        aria-modal="true"
        data-side={side}
        className={cn(
          "ml-auto flex h-full w-full max-w-md flex-col border-l bg-background p-6 shadow-2xl",
          side === "left" && "mr-auto ml-0 border-l-0 border-r",
          side === "top" && "mb-auto h-auto max-w-none border-b border-l-0",
          side === "bottom" && "mt-auto h-auto max-w-none border-l-0 border-t",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

type SheetCloseProps = {
  render?: ReactElement<{ onClick?: (event: React.MouseEvent) => void }>
  children?: ReactNode
}

function SheetClose({ render, children }: SheetCloseProps) {
  const { onOpenChange } = useContext(SheetContext)
  const handleClick = (event: React.MouseEvent) => {
    render?.props.onClick?.(event)
    onOpenChange?.(false)
  }
  if (render) return cloneElement(render, { onClick: handleClick })
  return <button type="button" onClick={handleClick}>{children}</button>
}

function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />
}

function SheetTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />
}

function SheetDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle }
