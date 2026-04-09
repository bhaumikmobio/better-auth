import type { ReactNode } from "react";

export function CenteredCard({
  title,
  description,
  children,
  footer,
  maxWidthClassName = "max-w-md",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <div
        className={`w-full ${maxWidthClassName} rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-950`}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>

        {children}

        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}

