import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import type { ActionResult } from "@/server/action-result";

/**
 * Pushes server-side validation errors back into a React Hook Form instance so
 * the message appears under the offending field rather than only in a toast.
 * Returns the message that should be shown as a toast, if any.
 */
export function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  result: Extract<ActionResult<unknown>, { ok: false }>,
): string | null {
  const { fieldErrors, error } = result;

  if (!fieldErrors) return error;

  let matched = false;

  for (const [field, messages] of Object.entries(fieldErrors)) {
    const message = messages?.[0];
    if (!message) continue;

    if (field in form.getValues()) {
      form.setError(field as Path<T>, { type: "server", message });
      matched = true;
    }
  }

  // Only surface a toast when nothing landed on a visible field.
  return matched ? null : error;
}
