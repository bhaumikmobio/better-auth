"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStandupHistory,
  type StandupFeedItem,
} from "@/lib/standup-api";

const DEFAULT_LIMIT = 50;
const DEFAULT_DAYS = 7;

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (DEFAULT_DAYS - 1));
  return {
    fromDate: formatDateInput(from),
    toDate: formatDateInput(to),
  };
}

type UseStandupHistoryResult = {
  rows: StandupFeedItem[];
  totalInRange: number;
  totalCount: number | null;
  fromDate: string;
  toDate: string;
  searchTerm: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  setSearchTerm: (value: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
  clearFilters: () => void;
};

export function useStandupHistory(): UseStandupHistoryResult {
  const defaults = getDefaultDateRange();
  const [fromDate, setFromDate] = useState(defaults.fromDate);
  const [toDate, setToDate] = useState(defaults.toDate);
  const [standups, setStandups] = useState<StandupFeedItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearFilters = useCallback(() => {
    const range = getDefaultDateRange();
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setSearchTerm("");
  }, []);

  const rows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return standups;
    }

    return standups.filter((item) =>
      item.user.name.toLowerCase().includes(normalizedSearch),
    );
  }, [searchTerm, standups]);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const data = await getStandupHistory({
          from: fromDate,
          to: toDate,
          limit: DEFAULT_LIMIT,
          offset: 0,
        });

        if (!active) return;
        setStandups(data.standups);
        setTotalCount(data.filters.total);
        setErrorMessage(null);
      } catch (error) {
        if (!active) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to fetch stand-up history.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [fromDate, toDate]);

  return {
    rows,
    totalInRange: standups.length,
    totalCount,
    fromDate,
    toDate,
    searchTerm,
    setFromDate,
    setToDate,
    setSearchTerm,
    isLoading,
    errorMessage,
    clearFilters,
  };
}
