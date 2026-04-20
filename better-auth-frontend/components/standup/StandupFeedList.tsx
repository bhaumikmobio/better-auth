"use client";

import { motion } from "framer-motion";
import type { StandupFeedItem } from "@/lib/standup-api";

const EMOJI_CHOICES = ["🔥", "✅", "👏", "💡", "🚀"] as const;

type StandupFeedListProps = {
  standups: StandupFeedItem[];
  isReacting: boolean;
  onToggleReaction: (standupId: string, emoji: string, reactedByMe: boolean) => Promise<void>;
};

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function StandupFeedList({ standups, isReacting, onToggleReaction }: StandupFeedListProps) {
  if (standups.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-300/60 bg-white/55 p-6 text-sm text-slate-600 backdrop-blur-xl">
        No stand-up updates yet today. Be the first to post.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {standups.map((item) => (
        <motion.article
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl border border-slate-300/60 bg-white/70 p-4 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)] backdrop-blur-xl"
        >
          <div className="mb-2 flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h3 className="text-sm font-semibold text-slate-900">{item.user.name}</h3>
            <span className="text-xs text-slate-500">{formatTime(item.createdAt)}</span>
          </div>

          <div className="grid gap-1.5 text-sm text-slate-700">
            <p className="rounded-lg bg-slate-50/80 px-3 py-1.5">
              <span className="font-semibold text-slate-900">Yesterday:</span> {item.yesterday}
            </p>
            <p className="rounded-lg bg-slate-50/80 px-3 py-1.5">
              <span className="font-semibold text-slate-900">Today:</span> {item.today}
            </p>
            <p className="rounded-lg bg-slate-50/80 px-3 py-1.5">
              <span className="font-semibold text-slate-900">Blockers:</span> {item.blockers}
            </p>
            {item.mood ? (
              <p className="rounded-lg bg-slate-50/80 px-3 py-1.5">
                <span className="font-semibold text-slate-900">Mood:</span> {item.mood}
              </p>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {EMOJI_CHOICES.map((emoji) => {
              const existing = item.reactions.find((reaction) => reaction.emoji === emoji);
              const count = existing?.count ?? 0;
              const reactedByMe = existing?.reactedByMe ?? false;
              return (
                <button
                  key={emoji}
                  type="button"
                  disabled={isReacting}
                  onClick={() => void onToggleReaction(item.id, emoji, reactedByMe)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition ${
                    reactedByMe
                      ? "border-blue-300 bg-blue-100/80 text-blue-800"
                      : "border-slate-300 bg-slate-100/70 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <span>{emoji}</span>
                  {count > 0 ? <span className="text-xs font-semibold">{count}</span> : null}
                </button>
              );
            })}
          </div>
        </motion.article>
      ))}
    </div>
  );
}
