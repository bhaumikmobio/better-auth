import { apiRequest } from "@/lib/api-client";

type AskChatbotResponse = {
  message: string;
  data: {
    answer: string;
    sources: Array<{
      standupId: string;
      userId: string;
      createdAt: string;
      content: string;
      score: number;
    }>;
  };
};

export async function askChatbot(query: string, topK = 4) {
  const payload = await apiRequest<AskChatbotResponse>("/chatbot/ask", {
    method: "POST",
    json: { query, topK },
  });

  return payload.data;
}
