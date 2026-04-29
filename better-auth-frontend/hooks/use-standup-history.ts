"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStandupHistory,
  type StandupFeedItem,
} from "@/lib/standup-api";

const PAGE_SIZE = 100;

function getDefaultDateRange() {
  return {
    fromDate: "",
    toDate: "",
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
        let offset = 0;
        let total = Number.POSITIVE_INFINITY;
        const allStandups: StandupFeedItem[] = [];

        while (offset < total) {
          const data = await getStandupHistory({
            from: fromDate || undefined,
            to: toDate || undefined,
            limit: PAGE_SIZE,
            offset,
          });

          allStandups.push(...data.standups);
          total = data.filters.total;

          if (data.standups.length === 0 || allStandups.length >= total) {
            break;
          }

          offset += PAGE_SIZE;
        }

        if (!active) return;
        setStandups(allStandups);
        setTotalCount(Number.isFinite(total) ? total : allStandups.length);
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
