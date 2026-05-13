import { routes } from "@/constants/routes";
import type { NavigationItem, RoleNavigation } from "@/types/navigation";

export const publicNavigation: NavigationItem[] = [
  {
    title: "Features",
    href: routes.public.features,
  },
  {
    title: "Privacy",
    href: routes.public.privacy,
  },
  {
    title: "Terms",
    href: routes.public.terms,
  },
];

export const adminNavigation: RoleNavigation = {
  role: "admin",
  label: "Admin",
  homeHref: routes.admin.dashboard,
  items: [
    {
      title: "Dashboard",
      href: routes.admin.dashboard,
      description: "Operational overview",
    },
    {
      title: "Sessions",
      href: routes.admin.sessions,
      description: "Manage attendance sessions",
    },
    {
      title: "Users",
      href: routes.admin.users,
      description: "Manage people and roles",
    },
    {
      title: "Reports",
      href: routes.admin.reports,
      description: "Review attendance outcomes",
    },
    {
      title: "Settings",
      href: routes.admin.settings,
      description: "Workspace configuration",
    },
  ],
};

export const instructorNavigation: RoleNavigation = {
  role: "instructor",
  label: "Instructor",
  homeHref: routes.instructor.dashboard,
  items: [
    {
      title: "Dashboard",
      href: routes.instructor.dashboard,
      description: "Teaching overview",
    },
    {
      title: "Sessions",
      href: routes.instructor.sessions,
      description: "Session attendance tools",
    },
  ],
};

export const studentNavigation: RoleNavigation = {
  role: "student",
  label: "Student",
  homeHref: routes.student.scan,
  items: [
    {
      title: "Scan",
      href: routes.student.scan,
      description: "Check in with a QR code",
    },
    {
      title: "History",
      href: routes.student.attendance,
      description: "Attendance record",
    },
    {
      title: "Profile",
      href: routes.student.profile,
      description: "Student information",
    },
  ],
};
