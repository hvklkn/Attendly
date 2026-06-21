import { routes } from "@/constants/routes";
import type { NavigationItem, RoleNavigation } from "@/types/navigation";

export const publicNavigation: NavigationItem[] = [
  {
    title: "Özellikler",
    href: routes.public.features,
  },
  {
    title: "Gizlilik",
    href: routes.public.privacy,
  },
  {
    title: "Koşullar",
    href: routes.public.terms,
  },
];

export const adminNavigation: RoleNavigation = {
  role: "admin",
  label: "Yönetim",
  homeHref: routes.admin.dashboard,
  items: [
    {
      title: "Panel",
      href: routes.admin.dashboard,
      description: "Operasyon özeti",
      icon: "dashboard",
    },
    {
      title: "Dersler / Kurslar",
      href: routes.admin.courses,
      description: "Ders ve kurs kataloğu",
      icon: "courses",
    },
    {
      title: "Odalar",
      href: routes.admin.rooms,
      description: "Derslik ve konum alanları",
      icon: "rooms",
    },
    {
      title: "Yoklama Oturumları",
      href: routes.admin.sessions,
      description: "Yoklama oturumlarını yönetin",
      icon: "sessions",
    },
    {
      title: "Ders Grupları",
      href: routes.admin.sections,
      description: "Ders, öğretmen ve öğrenci kapsamı",
      icon: "sections",
    },
    {
      title: "Kullanıcılar",
      href: routes.admin.users,
      description: "Kişileri ve rolleri yönetin",
      icon: "users",
    },
    {
      title: "Raporlar",
      href: routes.admin.reports,
      description: "Yoklama sonuçlarını inceleyin",
      icon: "reports",
    },
    {
      title: "Ayarlar",
      href: routes.admin.settings,
      description: "Çalışma alanı ayarları",
      icon: "settings",
    },
    {
      title: "Profil",
      href: routes.admin.profile,
      description: "Hesap ve şifre",
      icon: "profile",
    },
  ],
};

export const instructorNavigation: RoleNavigation = {
  role: "instructor",
  label: "Öğretmen",
  homeHref: routes.instructor.dashboard,
  items: [
    {
      title: "Panel",
      href: routes.instructor.dashboard,
      description: "Ders özeti",
      icon: "dashboard",
    },
    {
      title: "Yoklama Oturumları",
      href: routes.instructor.sessions,
      description: "Yoklama araçları",
      icon: "sessions",
    },
    {
      title: "Öğrenciler",
      href: routes.instructor.students,
      description: "Ders grubu kayıtları",
      icon: "users",
    },
    {
      title: "Raporlar",
      href: routes.instructor.reports,
      description: "Ders ve şube devam raporları",
      icon: "reports",
    },
    {
      title: "Profil",
      href: routes.instructor.profile,
      description: "Hesap ve şifre",
      icon: "profile",
    },
  ],
};

export const studentNavigation: RoleNavigation = {
  role: "student",
  label: "Öğrenci",
  homeHref: routes.student.scan,
  items: [
    {
      title: "QR Okut",
      href: routes.student.scan,
      description: "QR kod ile yoklamaya katıl",
      icon: "scan",
    },
    {
      title: "Geçmiş",
      href: routes.student.attendance,
      description: "Yoklama kayıtları",
      icon: "history",
    },
    {
      title: "Profil",
      href: routes.student.profile,
      description: "Öğrenci bilgileri",
      icon: "profile",
    },
  ],
};
