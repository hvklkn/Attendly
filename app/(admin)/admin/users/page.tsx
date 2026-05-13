import { Filter, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminUsersData } from "@/lib/admin/queries";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/[ @._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function getRoleTone(role: string) {
  if (role === "ORG_ADMIN" || role === "SUPER_ADMIN") return "info" as const;
  if (role === "INSTRUCTOR") return "success" as const;
  return "neutral" as const;
}

function getStatusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "INVITED") return "warning" as const;
  if (status === "SUSPENDED") return "danger" as const;
  return "neutral" as const;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const authContext = await requireAdminAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const memberships = await getAdminUsersData(authContext, { query });

  return (
    <>
      <PageHeader
        eyebrow="Access management"
        title="Users"
        description="Read organization members and their role-based access from the Membership model."
      >
        <ButtonLink
          href="/admin/users"
          variant="primary"
          icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        >
          Invite user
        </ButtonLink>
      </PageHeader>

      <SectionCard
        title="User directory"
        description="Membership records are scoped to the current organization before user details are selected."
      >
        <form
          action="/admin/users"
          className="mb-5 grid gap-3 lg:grid-cols-[1fr_140px_180px_180px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Search users</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Search users"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-400"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Role
          </button>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-400"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Status
          </button>
        </form>

        {memberships.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {memberships.map((membership) => (
                    <tr key={membership.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                            {getInitials(
                              membership.user.name,
                              membership.user.email,
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-950">
                              {membership.user.name ?? "Unnamed user"}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {membership.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={formatEnum(membership.role)}
                          tone={getRoleTone(membership.role)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={formatEnum(membership.user.status)}
                          tone={getStatusTone(membership.user.status)}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {membership.organization.name}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDate(membership.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {memberships.map((membership) => (
                <article
                  key={membership.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                      {getInitials(
                        membership.user.name,
                        membership.user.email,
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-950">
                        {membership.user.name ?? "Unnamed user"}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {membership.user.email}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge
                          label={formatEnum(membership.role)}
                          tone={getRoleTone(membership.role)}
                        />
                        <StatusBadge
                          label={formatEnum(membership.user.status)}
                          tone={getStatusTone(membership.user.status)}
                        />
                      </div>
                      <p className="mt-3 text-xs text-neutral-500">
                        Updated {formatDate(membership.updatedAt)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={query ? "No users match your search" : "No users connected"}
            description={
              query
                ? "Try another search term, or clear the search to view all organization memberships."
                : "Members will appear here after tenant membership records are created."
            }
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
