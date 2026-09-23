"use client";

import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AccountForm } from "@/components/accounts/account-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ResponsiveDialog } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrencyCode } from "@/lib/currency";
import {
  deleteAccountAction,
  setAccountArchivedAction,
} from "@/server/actions/accounts";
import type { AccountDTO } from "@/types";

type AccountActionsProps = {
  account: AccountDTO;
  currency: CurrencyCode;
  /** Where to go after the account is deleted. */
  redirectTo?: string;
  /** "subtle" suits a dense card; the default suits a page header. */
  tone?: "default" | "subtle";
};

/** Edit, archive and delete for a single account. */
export function AccountActions({
  account,
  currency,
  redirectTo,
  tone = "default",
}: AccountActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggleArchived() {
    setPending(true);
    const result = await setAccountArchivedAction(account.id, !account.archived);
    setPending(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(account.archived ? "Account restored" : "Account archived", {
      description: account.archived
        ? "It counts towards your total balance again."
        : "It no longer counts towards your total balance.",
    });
    router.refresh();
  }

  async function handleDelete() {
    const result = await deleteAccountAction(account.id);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Account deleted", { description: account.name });

    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={tone === "subtle" ? "ghost" : "outline"}
            size={tone === "subtle" ? "icon-sm" : "icon"}
            disabled={pending}
            aria-label={`Actions for ${account.name}`}
            className={tone === "subtle" ? "shrink-0 text-muted-foreground" : undefined}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setEditing(true)} className="gap-2">
            <Pencil className="size-4" aria-hidden="true" />
            Edit account
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={toggleArchived} className="gap-2">
            {account.archived ? (
              <>
                <ArchiveRestore className="size-4" aria-hidden="true" />
                Restore
              </>
            ) : (
              <>
                <Archive className="size-4" aria-hidden="true" />
                Archive
              </>
            )}
          </DropdownMenuItem>

          <ConfirmDialog
            trigger={
              <DropdownMenuItem
                onSelect={(event) => event.preventDefault()}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            }
            title={`Delete ${account.name}?`}
            description={
              account.transactionCount > 0
                ? `This will also permanently delete ${account.transactionCount} transaction${
                    account.transactionCount === 1 ? "" : "s"
                  } recorded against this account. This cannot be undone.`
                : "This account will be permanently removed. This cannot be undone."
            }
            confirmLabel="Delete account"
            destructive
            onConfirm={handleDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <ResponsiveDialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit account"
        description="Update the name, type or opening balance."
      >
        <AccountForm currency={currency} account={account} onDone={() => setEditing(false)} />
      </ResponsiveDialog>
    </>
  );
}
