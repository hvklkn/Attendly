import type { AppRole } from "@/types/roles";

export type NavigationItem = {
  title: string;
  href: string;
  description?: string;
};

export type RoleNavigation = {
  role: AppRole;
  label: string;
  homeHref: string;
  items: NavigationItem[];
};
