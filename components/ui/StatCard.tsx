import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  trend?: string;
  icon?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
};

const toneStyles = {
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-rose-50 text-rose-700 ring-rose-100",
  info: "bg-sky-50 text-sky-700 ring-sky-100",
};

export function StatCard({
  label,
  value,
  description,
  trend,
  icon,
  tone = "neutral",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "min-h-36 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle transition hover:border-neutral-300",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-700">{label}</p>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md ring-1",
              toneStyles[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-3xl font-semibold tracking-normal text-neutral-950 sm:text-4xl">
          {value}
        </p>
        {trend ? (
          <p className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
            {trend}
          </p>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}
