"use client";

import type { InputHTMLAttributes } from "react";
import { useState } from "react";
import { PASSWORD_POLICY } from "@/constants/messages";
import { INPUT_CLASSNAME } from "./AuthInputField";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, ...inputProps }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { className, maxLength, ...restInputProps } = inputProps;
  const inputClassName = `${INPUT_CLASSNAME} pr-10${className ? ` ${className}` : ""}`;

  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="relative mt-2">
        <input
          {...restInputProps}
          type={isVisible ? "text" : "password"}
          maxLength={maxLength ?? PASSWORD_POLICY.maxLength}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M10.733 5.076A10.744 10.744 0 0 1 12 5c4.642 0 8.71 2.937 9.938 7a10.79 10.79 0 0 1-1.922 3.392" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499A10.75 10.75 0 0 1 12 19c-4.642 0-8.71-2.937-9.938-7a10.761 10.761 0 0 1 2.723-4.731" />
      <path d="m2 2 20 20" />
    </svg>
  );
}
