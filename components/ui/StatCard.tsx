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
  neutral: "bg-neutral-100 text-neutral-600",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  info: "bg-sky-50 text-sky-700",
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
        "rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-neutral-600">{label}</p>
        {icon ? (
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              toneStyles[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-semibold tracking-normal text-neutral-950">
          {value}
        </p>
        {trend ? (
          <p className="text-xs font-medium text-neutral-500">{trend}</p>
        ) : null}
      </div>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}
