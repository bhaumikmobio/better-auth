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
    standups: StandupFeedItem[];
  };
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
    users: Array<{ id: string }>;
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
  const payload = await apiRequest<GetAdminUsersResponse>('/admin/users?limit=1&offset=0', {
    method: 'GET',
  });

  return payload.data.total;
}
