import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  actionHref,
  actionLabel,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-white text-neutral-500 shadow-subtle">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
