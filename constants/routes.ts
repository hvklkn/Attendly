export const routes = {
  public: {
    home: "/",
    features: "/features",
    privacy: "/privacy",
    terms: "/terms",
    login: "/login",
  },
  admin: {
    root: "/admin",
    dashboard: "/admin/dashboard",
    sessions: "/admin/sessions",
    sessionCreate: "/admin/sessions/new",
    sessionDetail: "/admin/sessions/session-id",
    users: "/admin/users",
    reports: "/admin/reports",
    settings: "/admin/settings",
  },
  instructor: {
    root: "/instructor",
    dashboard: "/instructor/dashboard",
    sessions: "/instructor/sessions",
    sessionDetail: "/instructor/sessions/session-id",
  },
  student: {
    root: "/student",
    scan: "/student/scan",
    scanResult: "/student/scan/result",
    attendance: "/student/attendance",
    profile: "/student/profile",
  },
} as const;
