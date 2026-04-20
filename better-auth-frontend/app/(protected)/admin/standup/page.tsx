import { StandupAdminDashboard } from "@/components/admin/StandupAdminDashboard";

export default function AdminStandupPage() {
  return (
    <section className="h-full space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Daily stand-up</h2>
        <p className="text-sm text-slate-600">Monitor daily submissions, blockers, and prompt settings.</p>
      </div>
      <StandupAdminDashboard />
    </section>
  );
}
