type AdminUserRoleBadgeProps = {
  role: string;
};

export function AdminUserRoleBadge({ role }: AdminUserRoleBadgeProps) {
  const normalizedRole = role.trim().toLowerCase();
  const styles =
    normalizedRole === "admin"
      ? "bg-rose-50 text-rose-700"
      : "bg-sky-50 text-sky-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}>
      {normalizedRole}
    </span>
  );
}
