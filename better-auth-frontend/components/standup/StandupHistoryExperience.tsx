"use client";

import { useStandupHistory } from "@/hooks/use-standup-history";
import { StandupHistoryTable } from "./StandupHistoryTable";

export function StandupHistoryExperience() {
  const {
    rows,
    fromDate,
    toDate,
    searchTerm,
    setFromDate,
    setToDate,
    setSearchTerm,
    isLoading,
    errorMessage,
    clearFilters,
  } = useStandupHistory();

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-cyan-50/40 to-sky-50/50 p-4 shadow-[0_16px_30px_-28px_rgba(14,116,144,0.75)]">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">
          Standup History
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          View yesterday and prior stand-ups with date-wise filtering.
        </p>
      </div>
      <StandupHistoryTable
        rows={rows}
        fromDate={fromDate}
        toDate={toDate}
        searchTerm={searchTerm}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onSearchTermChange={setSearchTerm}
        onClearFilters={clearFilters}
      />
    </section>
  );
}
