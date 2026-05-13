import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-2 text-sm font-medium uppercase tracking-normal text-emerald-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-normal text-neutral-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-base leading-7 text-neutral-600">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 gap-3">{children}</div> : null}
    </div>
  );
}
