import type { AppRole } from "@/types/roles";

export type NavigationItem = {
  title: string;
  href: string;
  description?: string;
  icon?: NavigationIcon;
};

export type RoleNavigation = {
  role: AppRole;
  label: string;
  homeHref: string;
  items: NavigationItem[];
};

export type NavigationIcon =
  | "dashboard"
  | "sessions"
  | "users"
  | "reports"
  | "settings"
  | "scan"
  | "history"
  | "profile";
