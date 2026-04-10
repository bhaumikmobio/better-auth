import type { InputHTMLAttributes } from "react";

type AuthInputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

const INPUT_CLASSNAME =
  "mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-zinc-900 dark:focus:ring-white/10";

export function AuthInputField({ label, ...inputProps }: AuthInputFieldProps) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input className={INPUT_CLASSNAME} {...inputProps} />
    </label>
  );
}
