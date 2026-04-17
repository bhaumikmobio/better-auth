import type { ReactNode } from "react";

export function CenteredCard({
  title,
  titleClassName,
  description,
  children,
  footer,
  topContent,
  maxWidthClassName = "max-w-md",
}: {
  title: string;
  titleClassName?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  topContent?: ReactNode;
  maxWidthClassName?: string;
}) {
  return (
    <div
      className={`flex flex-1 justify-center px-6 ${
        topContent ? "items-start py-10 sm:py-14" : "items-center py-10 sm:py-16"
      }`}
    >
      <div className={`w-full ${maxWidthClassName}`}>
        <div className="space-y-5">
          {topContent ? <div>{topContent}</div> : null}

          <div className="rounded-3xl border border-sky-100/90 bg-white/95 p-6 shadow-[0_30px_60px_-35px_rgba(14,116,144,0.65)] backdrop-blur-sm sm:p-7">
            <div className="mb-6">
              <h1
                className={`text-2xl font-semibold tracking-tight text-slate-900 ${titleClassName ?? ""}`}
              >
                {title}
              </h1>
              {description ? (
                <p className="mt-1 text-sm text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>

            {children}

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

