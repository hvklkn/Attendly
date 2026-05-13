import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AuthContext } from "@/types/auth";

type AppTopbarProps = {
  areaLabel: string;
  authContext?: AuthContext;
};

export function AppTopbar({ areaLabel, authContext }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-neutral-500">
            Workspace
          </p>
          <p className="text-sm font-semibold text-neutral-950">
            {authContext
              ? authContext.activeOrganization.name
              : `${areaLabel} area`}
          </p>
        </div>
        {authContext ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-neutral-950">
                {authContext.user.name ?? authContext.user.email}
              </p>
              <p className="text-xs text-neutral-500">{authContext.role}</p>
            </div>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
              >
                Logout
              </button>
            </form>
          </div>
        ) : (
          <StatusBadge label="Scaffold" tone="info" />
        )}
      </div>
    </header>
  );
}
