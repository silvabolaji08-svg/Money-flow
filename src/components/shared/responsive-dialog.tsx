"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/**
 * One modal that adapts to the device: a centred dialog on laptops and up, a
 * bottom sheet on phones, where reaching the top of the screen is awkward.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: ResponsiveDialogProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("sm:max-w-[30rem]", className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "max-h-[92dvh] gap-0 overflow-y-auto rounded-t-3xl px-5 pb-8 pt-2",
          className,
        )}
      >
        {/* Grab handle — signals the sheet can be dismissed by dragging. */}
        <div
          className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-border"
          aria-hidden="true"
        />
        <SheetHeader className="px-0 pb-4">
          <SheetTitle className="text-left text-lg">{title}</SheetTitle>
          {description ? (
            <SheetDescription className="text-left">{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
