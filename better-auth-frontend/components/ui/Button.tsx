import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 text-white shadow-[0_14px_30px_-16px_rgba(12,74,110,0.9)] hover:from-cyan-500 hover:via-sky-600 hover:to-blue-700 focus-visible:ring-sky-400/70",
  secondary:
    "border border-sky-300/90 bg-white/90 text-sky-800 shadow-[0_12px_25px_-18px_rgba(12,74,110,0.8)] hover:border-sky-400 hover:bg-sky-100/85 hover:text-blue-900 focus-visible:ring-sky-300",
};

export function Button({
  variant = "primary",
  fullWidth,
  isLoading,
  disabled,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}) {
  const isDisabled = Boolean(disabled || isLoading);

  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const size =
    variant === "primary" ? "h-11 rounded-xl px-4 text-sm" : "h-11 rounded-xl px-4 text-sm";
  const width = fullWidth ? "w-full" : "";
  const variantClass = VARIANT_CLASSNAME[variant];

  const finalClassName = [base, size, width, variantClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      type={props.type ?? "button"}
      disabled={isDisabled}
      className={finalClassName}
    >
      {children}
    </button>
  );
}

