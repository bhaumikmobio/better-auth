"use client";

import { useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";

type Role = "user" | "admin";

type ChangeRoleFormProps = {
  userId: string;
};

const ROLES: Role[] = ["user", "admin"];

export function ChangeRoleForm({ userId }: ChangeRoleFormProps) {
  const [role, setRole] = useState<Role>("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest(`/admin/users/${encodeURIComponent(userId)}/role`, {
        method: "PATCH",
        json: { role },
      });

      toast.success("Role updated successfully.");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update role.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-4">
      <label htmlFor="role" className="block text-sm font-medium">
        Assign Role
      </label>

      <select
        id="role"
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
        className="w-full rounded-md border bg-white px-3 py-2 text-sm"
        disabled={isSubmitting}
      >
        {ROLES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Updating..." : "Update Role"}
      </button>
    </form>
  );
}
