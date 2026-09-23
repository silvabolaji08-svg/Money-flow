import type { Metadata } from "next";
import { Target } from "lucide-react";

import { AddGoalButton } from "@/components/goals/add-goal-button";
import { GoalCard } from "@/components/goals/goal-card";
import { AnimatedAmount, AnimatedPercent } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { listSavingsGoals, summariseGoals } from "@/server/queries/goals";
import { requireUser } from "@/server/session";

export const metadata: Metadata = {
  title: "Savings Goals",
  description: "Set targets for the things you are saving towards and track progress.",
};

export default async function GoalsPage() {
  const user = await requireUser();
  const goals = await listSavingsGoals(user.id);
  const summary = summariseGoals(goals);

  const active = goals.filter((goal) => !goal.completed);
  const completed = goals.filter((goal) => goal.completed);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Savings Goals"
        description="Name what you are saving for, set a target, and close the gap."
        actions={<AddGoalButton />}
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals yet"
          description="An emergency fund, a new laptop, a trip — give the money you set aside a purpose and a target."
          action={<AddGoalButton label="Create your first goal" />}
        />
      ) : (
        <>
          <section className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            <SummaryStat label="Total saved">
              <AnimatedAmount
                value={summary.totalSaved}
                currency={user.currency}
                className="text-xl font-semibold text-savings"
              />
            </SummaryStat>

            <SummaryStat label="Total target">
              <AnimatedAmount
                value={summary.totalTarget}
                currency={user.currency}
                className="text-xl font-semibold text-foreground"
              />
            </SummaryStat>

            <SummaryStat label="Overall progress">
              <AnimatedPercent
                value={summary.percentComplete}
                className="text-xl font-semibold text-foreground"
              />
            </SummaryStat>

            <SummaryStat label="Goals">
              <span className="text-xl font-semibold tnum text-foreground">
                {summary.activeCount} active
                {summary.completedCount > 0 ? (
                  <span className="ml-2 text-sm font-normal text-positive">
                    {summary.completedCount} funded
                  </span>
                ) : null}
              </span>
            </SummaryStat>
          </section>

          <Reveal id="goals-list" stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((goal) => (
              <GoalCard key={goal.id} goal={goal} currency={user.currency} />
            ))}
          </Reveal>

          {completed.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-muted-foreground">Fully funded</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {completed.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} currency={user.currency} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
