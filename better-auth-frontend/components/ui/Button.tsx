import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

const VARIANT_CLASSNAME: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
  secondary:
    "border border-black/10 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900",
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
    "inline-flex items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  const size = variant === "primary" ? "h-11 rounded-xl px-4 text-sm" : "rounded-lg px-3 py-2 text-sm";
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

