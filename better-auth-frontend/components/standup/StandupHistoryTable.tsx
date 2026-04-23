"use client";

import { BaseTable } from "@/components/ui/BaseTable";
import { Button } from "@/components/ui/Button";
import { AppLoader } from "@/components/ui/AppLoader";
import { STANDUP_HISTORY_COPY } from "@/constants/messages";
import type { StandupFeedItem } from "@/lib/standup-api";

type StandupHistoryTableProps = {
  rows: StandupFeedItem[];
  fromDate: string;
  toDate: string;
  searchTerm: string;
  isLoading: boolean;
  errorMessage: string | null;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onSearchTermChange: (value: string) => void;
  onClearFilters: () => void;
};

const INPUT_CLASSNAME =
  "h-10 w-full rounded-xl border border-slate-300/80 bg-white px-3 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200";

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StandupHistoryTable({
  rows,
  fromDate,
  toDate,
  searchTerm,
  isLoading,
  errorMessage,
  onFromDateChange,
  onToDateChange,
  onSearchTermChange,
  onClearFilters,
}: StandupHistoryTableProps) {
  const hasNameFilter = searchTerm.trim().length > 0;
  const showTableLoader = isLoading && rows.length === 0;
  const emptyMessage = hasNameFilter
    ? "No user matches found in this date range."
    : "No stand-up history found for this range.";

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.5)]">
      <div className="grid gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto] md:items-end">
        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          To
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            className={INPUT_CLASSNAME}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          User
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search by user name"
            className={INPUT_CLASSNAME}
          />
        </label>
        <div className="md:self-end">
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={isLoading}
            className="h-10 w-full whitespace-nowrap px-4"
          >
            Clear filters
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      {showTableLoader ? (
        <div className="rounded-xl border border-slate-200/80 bg-white/90">
          <AppLoader compact message={STANDUP_HISTORY_COPY.loadingTable} />
        </div>
      ) : (
        <BaseTable
          headers={[
            "Date",
            "Time",
            "Name",
            "Yesterday",
            "Today",
            "Blockers",
            "Mood",
            "Reactions",
          ]}
          isEmpty={!isLoading && rows.length === 0}
          emptyMessage={emptyMessage}
        >
          {rows.map((item) => (
            <tr key={item.id} className="border-t border-slate-200/80 align-top hover:bg-slate-50/70">
              <td className="px-4 py-3 text-sm text-slate-700">
                <div className="font-medium text-slate-800">{formatDate(item.createdAt)}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatTime(item.createdAt)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">{item.user.name}</td>
              <td className="max-w-xs px-4 py-3 text-sm text-slate-700">{item.yesterday}</td>
              <td className="max-w-xs px-4 py-3 text-sm text-slate-700">{item.today}</td>
              <td className="max-w-xs px-4 py-3 text-sm text-slate-700">{item.blockers}</td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{item.mood ?? "-"}</td>
              <td className="max-w-xs px-4 py-3 text-sm text-slate-700">
                {item.reactions.length === 0 ? (
                  <span className="text-xs text-slate-500">No reactions</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {item.reactions.map((reaction) => (
                      <span
                        key={`${item.id}-${reaction.emoji}`}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </BaseTable>
      )}
    </section>
  );
}
