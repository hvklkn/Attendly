import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonLinkVariant = "primary" | "secondary" | "ghost";

const variantStyles: Record<ButtonLinkVariant, string> = {
  primary: "border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800",
  secondary:
    "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:text-neutral-950",
  ghost:
    "border-transparent bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
};

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonLinkVariant;
  className?: string;
};

export function ButtonLink({
  href,
  children,
  icon,
  variant = "secondary",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition",
        variantStyles[variant],
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
