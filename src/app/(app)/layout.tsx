import { MobileTabBarWithAction } from "@/components/layout/mobile-add-button";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { QuickAddProvider } from "@/components/providers/quick-add-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { monthKey } from "@/lib/dates";
import { listAccountOptions } from "@/server/queries/accounts";
import { listBudgetableCategories, } from "@/server/queries/budgets";
import { listCategoryOptions } from "@/server/queries/categories";
import { requireUser } from "@/server/session";

/**
 * The authenticated shell. Every page beneath it is guaranteed a signed-in
 * user, and the option lists the create/edit dialogs need are loaded once here
 * rather than on each screen.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const now = new Date();

  const [accounts, categories, budgetCategories] = await Promise.all([
    listAccountOptions(user.id),
    listCategoryOptions(user.id),
    listBudgetableCategories(user.id, now),
  ]);

  return (
    <TooltipProvider delayDuration={200}>
      <QuickAddProvider
        currency={user.currency}
        accounts={accounts}
        categories={categories}
        budgetCategories={budgetCategories}
        currentMonth={monthKey(now)}
      >
        <div className="flex min-h-dvh w-full">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar name={user.name} email={user.email} />

            <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
              <div className="mx-auto w-full max-w-[82rem]">{children}</div>
            </main>
          </div>

          <MobileTabBarWithAction />
        </div>
      </QuickAddProvider>
    </TooltipProvider>
  );
}
