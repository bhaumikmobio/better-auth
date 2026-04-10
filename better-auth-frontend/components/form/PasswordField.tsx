import type { InputHTMLAttributes } from "react";
import { AuthInputField } from "./AuthInputField";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, ...inputProps }: PasswordFieldProps) {
  return <AuthInputField {...inputProps} label={label} type="password" />;
}
