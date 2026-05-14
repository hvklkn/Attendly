import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { routes } from "@/constants/routes";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={routes.public.home} className="text-lg font-semibold">
          {siteConfig.name}
        </Link>
        <Link
          href={routes.public.home}
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
        >
          Ana sayfaya dön
        </Link>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg items-center px-4 py-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}
