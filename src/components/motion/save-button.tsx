"use client";

import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SaveButtonProps = {
  /** True while the form is submitting. */
  pending: boolean;
  /**
   * Increment after each successful save. A counter rather than a boolean so
   * saving the same form twice confirms twice.
   */
  savedAt?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  savingLabel?: string;
  savedLabel?: string;
};

const CONFIRMATION_MS = 1800;

/**
 * A submit button that confirms in place.
 *
 * The toast says what was saved; this says *that* it was saved, right where
 * the eye already is. It settles back to its normal label on its own, so the
 * form never looks stuck in a success state.
 */
export function SaveButton({
  pending,
  savedAt = 0,
  disabled = false,
  className,
  label = "Save changes",
  savingLabel = "Saving",
  savedLabel = "Saved",
}: SaveButtonProps) {
  const [confirmed, setConfirmed] = useState(false);
  const lastSeen = useRef(savedAt);

  useEffect(() => {
    if (savedAt === lastSeen.current) return;
    lastSeen.current = savedAt;

    setConfirmed(true);
    const timer = setTimeout(() => setConfirmed(false), CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [savedAt]);

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className={cn("min-w-32", className)}
      // Announced politely so the confirmation is not only visual.
      aria-live="polite"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {savingLabel}
        </>
      ) : confirmed ? (
        <>
          <Check className="size-4 animate-pop-in" aria-hidden="true" />
          {savedLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
