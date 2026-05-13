import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  className?: string;
};

export function StatCard({
  label,
  value,
  description,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle",
        className,
      )}
    >
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950">
        {value}
      </p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}
