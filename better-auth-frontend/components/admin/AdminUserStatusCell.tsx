import type { AdminUser } from "@/lib/admin-api";

type AdminUserStatusCellProps = {
  status: AdminUser["status"];
};

export function AdminUserStatusCell({ status }: AdminUserStatusCellProps) {
  const isActive = status === "active";
  return (
    <div className="inline-flex items-center gap-2 text-sm text-slate-800">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
      <span className="capitalize">{status}</span>
    </div>
  );
}
