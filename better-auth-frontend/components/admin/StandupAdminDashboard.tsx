"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { AppLoader } from "@/components/ui/AppLoader";
import { useStandupAdmin } from "@/hooks/use-standup-admin";

export function StandupAdminDashboard() {
  const {
    totalUpdates,
    totalUsers,
    blockers,
    standups,
    dailyPrompt,
    participationPercent,
    isLoading,
    isSavingPrompt,
    errorMessage,
    saveDailyPrompt,
  } = useStandupAdmin();
  const [nextPrompt, setNextPrompt] = useState(dailyPrompt);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  useEffect(() => {
    setNextPrompt(dailyPrompt);
  }, [dailyPrompt]);

  const handleSavePrompt = async () => {
    const trimmed = nextPrompt.trim();
    if (trimmed.length === 0) {
      toast.error("Daily prompt is required.");
      return;
    }

    try {
      await saveDailyPrompt(trimmed);
      toast.success("Daily prompt updated.");
      setIsEditingPrompt(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update daily prompt.");
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {errorMessage}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4">
        <AppLoader compact message="Loading stand-up insights..." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-300/60 bg-white/75 p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.7)] backdrop-blur-xl">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                Active Prompt
              </span>
              <span className="text-xs text-slate-500">Team guidance for today&apos;s updates</span>
            </div>

            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              &quot;{dailyPrompt}&quot;
            </p>

            {isEditingPrompt ? (
              <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3">
                <textarea
                  value={nextPrompt}
                  onChange={(event) => setNextPrompt(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-300/75 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex items-center gap-2">
                  <Button onClick={handleSavePrompt} isLoading={isSavingPrompt}>
                    {isSavingPrompt ? "Saving..." : "Save prompt"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setNextPrompt(dailyPrompt);
                      setIsEditingPrompt(false);
                    }}
                    disabled={isSavingPrompt}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingPrompt(true)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-800"
              >
                <span>Update</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                  Participation Pulse
                </p>
                <p className="mt-1 text-xs text-slate-500">Current daily stand-up completion</p>
              </div>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                {totalUpdates}/{totalUsers || 0}
              </p>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 transition-all duration-300"
                style={{ width: `${participationPercent}%` }}
              />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700">{participationPercent}% achieved today.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Activity Feed</h3>
            <span className="text-xs font-medium text-slate-500">Today</span>
          </div>

          {standups.length === 0 ? (
            <div className="rounded-2xl border border-slate-300/60 bg-white/65 p-4 text-sm text-slate-600">
              No updates have been submitted yet today.
            </div>
          ) : (
            <div className="space-y-3">
              {standups.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-300/60 bg-white/75 p-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.7)] backdrop-blur-xl"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-base font-semibold text-slate-900">{item.user.name}</p>
                    <p className="text-xs text-slate-500">{formatTime(item.createdAt)}</p>
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Yesterday:</span> {item.yesterday}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Today:</span> {item.today}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Blockers:</span> {item.blockers}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.reactions.length === 0 ? (
                      <span className="text-xs text-slate-500">No reactions yet.</span>
                    ) : (
                      item.reactions.map((reaction) => (
                        <span
                          key={`${item.id}-${reaction.emoji}`}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-700"
                        >
                          <span>{reaction.emoji}</span>
                          <span>{reaction.count}</span>
                        </span>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Blocker Board</h3>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-500">Live</span>
          </div>

          {blockers.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/85 p-4 text-sm text-emerald-700">
              No blockers reported for today.
            </div>
          ) : (
            <div className="space-y-3">
              {blockers.map((item) => {
                const isBlocked = item.blockers.trim().toLowerCase() !== "no";
                return (
                  <article
                    key={item.standupId}
                    className="rounded-2xl border border-slate-300/60 bg-white/75 p-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.7)] backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.user.name}</p>
                        <p className="mt-1 text-sm text-slate-700">{item.blockers}</p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                          isBlocked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isBlocked ? "Blocked" : "Clear"}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs text-slate-600">
            Blockers are collected from daily stand-up submissions.
          </div>
        </div>
      </section>
    </div>
  );
}
