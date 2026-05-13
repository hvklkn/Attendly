import { Filter, Search, UserPlus, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";

const users = [
  {
    name: "Aylin Demir",
    email: "admin@attendly.local",
    role: "ORG_ADMIN",
    status: "Active",
    organization: "Demo University",
    lastSeen: "Today",
  },
  {
    name: "Nora Patel",
    email: "instructor@attendly.local",
    role: "INSTRUCTOR",
    status: "Active",
    organization: "Demo University",
    lastSeen: "Yesterday",
  },
  {
    name: "Eren Kaya",
    email: "student@attendly.local",
    role: "STUDENT",
    status: "Active",
    organization: "Demo University",
    lastSeen: "2 days ago",
  },
  {
    name: "Leo Chen",
    email: "leo.chen@example.edu",
    role: "INSTRUCTOR",
    status: "Invited",
    organization: "Demo University",
    lastSeen: "Pending",
  },
];

function getRoleTone(role: string) {
  if (role === "ORG_ADMIN" || role === "SUPER_ADMIN") return "info" as const;
  if (role === "INSTRUCTOR") return "success" as const;
  return "neutral" as const;
}

function getStatusTone(status: string) {
  return status === "Active" ? "success" as const : "warning" as const;
}

function formatRole(role: string) {
  return role.replace("_", " ");
}

export default function AdminUsersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Access management"
        title="Users"
        description="Manage workspace members and prepare role-aware access for admins, instructors, and students."
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
        description="Placeholder member list aligned with the Membership-based role model."
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Search users</span>
            <input
              placeholder="Search users"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Role
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Status
          </button>
        </div>

        {users.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {users.map((user) => (
                    <tr key={user.email}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                            {user.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-950">
                              {user.name}
                            </p>
                            <p className="mt-1 text-xs text-neutral-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={formatRole(user.role)}
                          tone={getRoleTone(user.role)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={user.status}
                          tone={getStatusTone(user.status)}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {user.organization}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {user.lastSeen}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {users.map((user) => (
                <article
                  key={user.email}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-sm font-semibold text-neutral-700">
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-950">
                        {user.name}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {user.email}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusBadge
                          label={formatRole(user.role)}
                          tone={getRoleTone(user.role)}
                        />
                        <StatusBadge
                          label={user.status}
                          tone={getStatusTone(user.status)}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="No users connected"
            description="Members will appear here after invitations and tenant membership flows are connected."
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </>
  );
}
