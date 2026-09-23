import { UnauthenticatedError } from "@/server/errors";

/**
 * Every server action returns this shape. Nothing throws across the
 * client/server boundary, so the UI can always render a useful message and
 * raw database errors never reach the browser.
 */
export type FieldErrors = Record<string, string[]>;

export type ActionFailure = { ok: false; error: string; fieldErrors?: FieldErrors };

export type ActionResult<T = undefined> = { ok: true; data: T } | ActionFailure;

export function success(): ActionResult<undefined>;
export function success<T>(data: T): ActionResult<T>;
export function success<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function failure(error: string, fieldErrors?: FieldErrors): ActionFailure {
  return { ok: false, error, fieldErrors };
}

/** Maps a ZodError into the field-error map React Hook Form expects. */
export function zodFieldErrors(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  return fieldErrors;
}

type PrismaKnownError = { code?: string; meta?: { target?: string[] | string } };

/**
 * Translates thrown errors into a safe, human message. Unexpected errors are
 * logged server-side and reported generically.
 */
export function toActionError(error: unknown, fallback = "Something went wrong. Please try again."): ActionFailure {
  if (error instanceof UnauthenticatedError) {
    return failure(error.message);
  }

  const known = error as PrismaKnownError;

  if (known?.code === "P2002") {
    return failure("That already exists. Try a different name.");
  }

  if (known?.code === "P2003") {
    return failure("That item is still referenced by other records.");
  }

  if (known?.code === "P2025") {
    return failure("We could not find that record.");
  }

  console.error("[moneyflow] action failed:", error);
  return failure(fallback);
}
