import type { Metadata } from "next";
import { format } from "date-fns";

import { CategoryManager } from "@/components/settings/category-manager";
import { DangerZone } from "@/components/settings/danger-zone";
import { PreferencesSection } from "@/components/settings/preferences-section";
import { ProfileSection } from "@/components/settings/profile-section";
import { SecuritySection } from "@/components/settings/security-section";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prisma";
import { listCategories } from "@/server/queries/categories";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your profile, preferences, categories and security.",
};

const TABS = [
  { value: "profile", label: "Profile" },
  { value: "preferences", label: "Preferences" },
  { value: "categories", label: "Categories" },
  { value: "security", label: "Security" },
];

export default async function SettingsPage(props: PageProps<"/settings">) {
  const user = await requireUser();
  const searchParams = await props.searchParams;

  const requested = typeof searchParams.tab === "string" ? searchParams.tab : "profile";
  const defaultTab = TABS.some((tab) => tab.value === requested) ? requested : "profile";

  const [categories, accounts, transactions, budgets, goals] = await Promise.all([
    listCategories(user.id),
    prisma.account.count({ where: { userId: user.id } }),
    prisma.transaction.count({ where: { userId: user.id } }),
    prisma.budget.count({ where: { userId: user.id } }),
    prisma.savingsGoal.count({ where: { userId: user.id } }),
  ]);

  const memberSince = format(user.createdAt, "MMMM yyyy");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Your profile, how amounts are displayed, and how the app looks."
      />

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="animate-fade">
          <Panel
            title="Profile"
            description="How you appear in MoneyFlow and where we reach you."
          >
            <ProfileSection
              name={user.name}
              email={user.email}
              memberSince={memberSince}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="preferences" className="animate-fade">
          <Panel
            title="Preferences"
            description="Currency, theme and the alerts you want to see."
          >
            <PreferencesSection
              currency={user.currency}
              budgetAlerts={user.budgetAlerts}
              savingsAlerts={user.savingsAlerts}
            />
          </Panel>
        </TabsContent>

        <TabsContent value="categories" className="animate-fade">
          <Panel
            title="Categories"
            description="Rename the built-in categories or add your own. Custom categories can be deleted once nothing uses them."
          >
            <CategoryManager categories={categories} />
          </Panel>
        </TabsContent>

        <TabsContent value="security" className="space-y-5 animate-fade">
          <Panel title="Security" description="Change the password used to sign in.">
            <SecuritySection memberSince={memberSince} />
          </Panel>

          <Panel title="Danger zone" description="Irreversible actions on this account.">
            <DangerZone counts={{ accounts, transactions, budgets, goals }} />
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface overflow-hidden">
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-[0.95rem] font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
