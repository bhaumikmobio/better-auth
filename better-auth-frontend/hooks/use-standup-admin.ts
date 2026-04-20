"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminParticipationTotalUsers,
  getStandupAdminSummary,
  getStandupFeed,
  type StandupFeedItem,
  updateStandupDailyPrompt,
} from "@/lib/standup-api";

type UseStandupAdminResult = {
  totalUpdates: number;
  totalUsers: number;
  blockers: Array<{
    standupId: string;
    blockers: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  }>;
  standups: StandupFeedItem[];
  dailyPrompt: string;
  participationPercent: number;
  isLoading: boolean;
  isSavingPrompt: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  saveDailyPrompt: (nextPrompt: string) => Promise<void>;
};

export function useStandupAdmin(): UseStandupAdminResult {
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [blockers, setBlockers] = useState<
    Array<{
      standupId: string;
      blockers: string;
      createdAt: string;
      user: {
        id: string;
        name: string;
      };
    }>
  >([]);
  const [dailyPrompt, setDailyPrompt] = useState("What is your main goal today?");
  const [standups, setStandups] = useState<StandupFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setErrorMessage(null);
    const [summary, usersTotal, feed] = await Promise.all([
      getStandupAdminSummary(),
      getAdminParticipationTotalUsers(),
      getStandupFeed(),
    ]);

    setTotalUpdates(summary.totalCount);
    setBlockers(summary.blockers);
    setTotalUsers(usersTotal);
    setDailyPrompt(feed.dailyPrompt);
    setStandups(feed.standups);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const [summary, usersTotal, feed] = await Promise.all([
          getStandupAdminSummary(),
          getAdminParticipationTotalUsers(),
          getStandupFeed(),
        ]);

        if (!active) return;
        setTotalUpdates(summary.totalCount);
        setBlockers(summary.blockers);
        setTotalUsers(usersTotal);
        setDailyPrompt(feed.dailyPrompt);
        setStandups(feed.standups);
        setErrorMessage(null);
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to fetch admin stand-up data.");
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
  }, []);

  const saveDailyPrompt = useCallback(
    async (nextPrompt: string) => {
      setIsSavingPrompt(true);
      try {
        const updated = await updateStandupDailyPrompt(nextPrompt);
        setDailyPrompt(updated.dailyPrompt);
      } finally {
        setIsSavingPrompt(false);
      }
    },
    [],
  );

  const participationPercent = useMemo(() => {
    if (totalUsers <= 0) return 0;
    return Math.min(100, Math.round((totalUpdates / totalUsers) * 100));
  }, [totalUpdates, totalUsers]);

  return {
    totalUpdates,
    totalUsers,
    blockers,
    standups,
    dailyPrompt,
    participationPercent,
    isLoading,
    isSavingPrompt,
    errorMessage,
    refresh,
    saveDailyPrompt,
  };
}
