import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/** Prisma error codes that mean "the connection went away", not "the query was wrong". */
const CONNECTION_ERROR_CODES = new Set(["P1001", "P1002", "P1017"]);

/** Operations that are safe to replay: they read, they never write. */
const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "$queryRaw",
  "$queryRawUnsafe",
]);

function isConnectionError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  if (code && CONNECTION_ERROR_CODES.has(code)) return true;

  const message = (error as { message?: string })?.message ?? "";
  return (
    message.includes("Server has closed the connection") ||
    message.includes("ConnectionClosed")
  );
}

/**
 * Prisma 7 requires an explicit driver adapter for SQL databases.
 * A single client is reused across hot reloads in development so we do not
 * exhaust the Postgres connection pool.
 */
const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and provide a PostgreSQL connection string.",
    );
  }

  // Keep the pool small enough for the deployment target: serverless runtimes
  // and local test runners open many short-lived clients at once. The idle
  // timeout sits below the server's own, so the pool is less likely to hand
  // out a connection the database has already closed.
  const poolMax = Number(process.env.DATABASE_POOL_MAX ?? 10);
  const idleTimeoutMillis = Number(process.env.DATABASE_POOL_IDLE_MS ?? 10_000);

  const client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: Number.isFinite(poolMax) ? poolMax : 10,
      idleTimeoutMillis: Number.isFinite(idleTimeoutMillis) ? idleTimeoutMillis : 10_000,
      allowExitOnIdle: true,
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  /**
   * Databases recycle pooled connections — idle timeouts, failovers, a
   * restarted dev server — and the pool can hand back one that is already
   * closed. Replaying the query on a fresh connection turns what would be a
   * 500 into a momentary pause. Only reads are retried: a write that may
   * already have been applied is never sent twice.
   */
  return client.$extends({
    query: {
      async $allOperations({ operation, args, query }) {
        try {
          return await query(args);
        } catch (error) {
          if (READ_OPERATIONS.has(operation) && isConnectionError(error)) {
            return await query(args);
          }
          throw error;
        }
      },
    },
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
