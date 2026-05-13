import Link from "next/link";
import { publicNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { routes } from "@/constants/routes";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link
          href={routes.public.home}
          className="text-lg font-semibold tracking-normal text-neutral-950"
        >
          {siteConfig.name}
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
          {publicNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              {item.title}
            </Link>
          ))}
          <Link
            href={routes.public.login}
            className="rounded-md bg-neutral-950 px-4 py-2 font-medium text-white transition hover:bg-neutral-800"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
