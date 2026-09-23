import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your MoneyFlow account.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const searchParams = await props.searchParams;

  // Set by `requireUser()` when it finds a session cookie it cannot use.
  // Resolved on the server so the message is in the HTML, not dependent on
  // hydration — this is exactly the moment someone needs to be told why they
  // are looking at a login form again.
  const sessionExpired = "expired" in searchParams;

  return (
    <Suspense fallback={<FormSkeleton />}>
      <LoginForm sessionExpired={sessionExpired} />
    </Suspense>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-60" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
