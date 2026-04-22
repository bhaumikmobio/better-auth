import { apiRequest } from '@/lib/api-client';

export type StandupReaction = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

export type StandupFeedItem = {
  id: string;
  createdAt: string;
  yesterday: string;
  today: string;
  blockers: string;
  mood: string | null;
  user: {
    id: string;
    name: string;
  };
  reactions: StandupReaction[];
};

type GetStandupFeedResponse = {
  message: string;
  data: {
    dailyPrompt: string;
    hasSubmittedToday: boolean;
    standups: StandupFeedItem[];
  };
};

export type StandupHistoryFilters = {
  from: string;
  to: string;
  limit: number;
  offset: number;
  total: number;
};

export type StandupHistoryData = {
  standups: StandupFeedItem[];
  filters: StandupHistoryFilters;
};

type GetStandupHistoryResponse = {
  message: string;
  data: StandupHistoryData;
};

type GetStandupAdminSummaryResponse = {
  message: string;
  data: {
    totalCount: number;
    blockers: Array<{
      standupId: string;
      blockers: string;
      createdAt: string;
      user: {
        id: string;
        name: string;
      };
    }>;
  };
};

type GetAdminUsersResponse = {
  message: string;
  data: {
    users: Array<{ id: string; role?: string; status?: "active" | "inactive" }>;
    total: number;
  };
};

export type SubmitStandupInput = {
  yesterday: string;
  today: string;
  blockers: string;
  mood?: string;
};

export async function submitStandup(input: SubmitStandupInput) {
  await apiRequest('/standup', {
    method: 'POST',
    json: input,
  });
}

export async function getStandupFeed() {
  const payload = await apiRequest<GetStandupFeedResponse>('/standup/feed', {
    method: 'GET',
  });

  return payload.data;
}

export async function getStandupHistory(params: {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit));
  }
  if (typeof params.offset === "number") {
    searchParams.set("offset", String(params.offset));
  }

  const queryString = searchParams.toString();
  const payload = await apiRequest<GetStandupHistoryResponse>(
    `/standup/history${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
    },
  );

  return payload.data;
}

export async function addStandupReaction(standupId: string, emoji: string) {
  await apiRequest(`/standup/${standupId}/reactions`, {
    method: 'POST',
    json: { emoji },
  });
}

export async function removeStandupReaction(standupId: string, emoji: string) {
  await apiRequest(`/standup/${standupId}/reactions/${encodeURIComponent(emoji)}`, {
    method: 'DELETE',
  });
}

export async function getStandupAdminSummary() {
  const payload = await apiRequest<GetStandupAdminSummaryResponse>(
    '/standup/admin/summary',
    {
      method: 'GET',
    },
  );

  return payload.data;
}

export async function updateStandupDailyPrompt(dailyPrompt: string) {
  const payload = await apiRequest<{
    message: string;
    data: { dailyPrompt: string; updatedAt: string };
  }>('/standup/admin/settings', {
    method: 'PATCH',
    json: { dailyPrompt },
  });

  return payload.data;
}

export async function getAdminParticipationTotalUsers() {
  const PAGE_SIZE = 200;
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  let participantCount = 0;

  while (offset < total) {
    const payload = await apiRequest<GetAdminUsersResponse>(
      `/admin/users?limit=${PAGE_SIZE}&offset=${offset}`,
      {
        method: 'GET',
      },
    );

    const users = payload.data.users ?? [];
    total = payload.data.total ?? users.length;

    participantCount += users.filter((user) => {
      const role = (user.role ?? '').toLowerCase();
      const hasAdminRole = role
        .split(',')
        .map((value) => value.trim())
        .includes('admin');
      return !hasAdminRole;
    }).length;

    if (users.length === 0) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return participantCount;
}
