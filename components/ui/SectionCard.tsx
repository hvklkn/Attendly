import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle",
        className,
      )}
    >
      {title || description ? (
        <div className="mb-5 border-b border-neutral-100 pb-4">
          {title ? (
            <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
