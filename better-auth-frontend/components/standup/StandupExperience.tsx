"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AppLoader } from "@/components/ui/AppLoader";
import { useStandupFeed } from "@/hooks/use-standup-feed";
import { submitStandup } from "@/lib/standup-api";
import { StandupFeedList } from "./StandupFeedList";
import { StandupFormCard } from "./StandupFormCard";

export function StandupExperience() {
  const { dailyPrompt, standups, isLoading, isReacting, errorMessage, refreshFeed, toggleReaction } =
    useStandupFeed();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: {
    yesterday: string;
    today: string;
    blockers: string;
    mood: string;
  }) => {
    setIsSubmitting(true);
    try {
      await submitStandup({
        yesterday: values.yesterday.trim(),
        today: values.today.trim(),
        blockers: values.blockers.trim(),
        mood: values.mood.trim() ? values.mood.trim() : undefined,
      });
      toast.success("Stand-up submitted.");
      await refreshFeed();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit stand-up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Updates today</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{standups.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Daily prompt</p>
          <p className="mt-2 line-clamp-2 text-sm text-slate-700">{dailyPrompt}</p>
        </article>
        <article className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-[0_18px_30px_-26px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Engagement</p>
          <p className="mt-2 text-sm text-slate-700">React, review blockers, and keep updates concise.</p>
        </article>
      </section>

      <div className="space-y-5">
        <section className="min-h-[18rem]">
          <StandupFormCard dailyPrompt={dailyPrompt} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        </section>

        <section className="min-h-[18rem] space-y-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">Team Feed</h3>
            <p className="text-sm text-slate-600">Today&apos;s updates and reactions.</p>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : isLoading ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
              <AppLoader compact message="Loading stand-up feed..." />
            </div>
          ) : (
            <StandupFeedList standups={standups} isReacting={isReacting} onToggleReaction={toggleReaction} />
          )}
        </section>
      </div>
    </div>
  );
}
