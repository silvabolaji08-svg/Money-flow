import "dotenv/config";
import { vi } from "vitest";

// Each test file runs in its own worker with its own connection pools. Keep
// them tiny so the whole suite stays well inside the database's limit.
process.env.DATABASE_POOL_MAX = "2";
process.env.DATABASE_POOL_IDLE_MS = "500";

/**
 * Next's cache invalidation helpers require a request context that does not
 * exist in a plain Node test run, so they are replaced with no-ops. Everything
 * else — validation, the database, and all financial calculation — runs for real.
 */
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
