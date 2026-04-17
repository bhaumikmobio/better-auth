import type { InputHTMLAttributes } from "react";

type AuthInputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const INPUT_CLASSNAME =
  "w-full rounded-xl border border-sky-200/80 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-200/70";

export function AuthInputField({ label, ...inputProps }: AuthInputFieldProps) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input className={`mt-2 ${INPUT_CLASSNAME}`} {...inputProps} />
    </label>
  );
}
