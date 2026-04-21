"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addStandupReaction,
  getStandupFeed,
  removeStandupReaction,
  type StandupFeedItem,
} from "@/lib/standup-api";

type UseStandupFeedResult = {
  dailyPrompt: string;
  hasSubmittedToday: boolean;
  standups: StandupFeedItem[];
  isLoading: boolean;
  isReacting: boolean;
  reactingTarget: { standupId: string; emoji: string } | null;
  errorMessage: string | null;
  refreshFeed: () => Promise<void>;
  toggleReaction: (standupId: string, emoji: string, reactedByMe: boolean) => Promise<void>;
};

export function useStandupFeed(): UseStandupFeedResult {
  const [dailyPrompt, setDailyPrompt] = useState("What is your main goal today?");
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [standups, setStandups] = useState<StandupFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReacting, setIsReacting] = useState(false);
  const [reactingTarget, setReactingTarget] = useState<{ standupId: string; emoji: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshFeed = useCallback(async () => {
    setErrorMessage(null);
    try {
      const data = await getStandupFeed();
      setDailyPrompt(data.dailyPrompt);
      setHasSubmittedToday(data.hasSubmittedToday);
      setStandups(data.standups);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch stand-up feed.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      try {
        const data = await getStandupFeed();
        if (!active) return;
        setDailyPrompt(data.dailyPrompt);
        setHasSubmittedToday(data.hasSubmittedToday);
        setStandups(data.standups);
        setErrorMessage(null);
      } catch (error) {
        if (!active) return;
        setErrorMessage(error instanceof Error ? error.message : "Failed to fetch stand-up feed.");
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

  const toggleReaction = useCallback(
    async (standupId: string, emoji: string, reactedByMe: boolean) => {
      setIsReacting(true);
      setReactingTarget({ standupId, emoji });
      try {
        if (reactedByMe) {
          await removeStandupReaction(standupId, emoji);
        } else {
          await addStandupReaction(standupId, emoji);
        }

        await refreshFeed();
      } finally {
        setIsReacting(false);
        setReactingTarget(null);
      }
    },
    [refreshFeed],
  );

  return {
    dailyPrompt,
    hasSubmittedToday,
    standups,
    isLoading,
    isReacting,
    reactingTarget,
    errorMessage,
    refreshFeed,
    toggleReaction,
  };
}
