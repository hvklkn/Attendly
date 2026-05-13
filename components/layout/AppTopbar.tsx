import { StatusBadge } from "@/components/ui/StatusBadge";

type AppTopbarProps = {
  areaLabel: string;
};

export function AppTopbar({ areaLabel }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
            Workspace
          </p>
          <p className="text-sm font-semibold text-neutral-950">
            {areaLabel} area
          </p>
        </div>
        <StatusBadge label="Scaffold" tone="info" />
      </div>
    </header>
  );
}
