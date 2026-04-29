"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizontal, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { askChatbot } from "@/lib/chatbot-api";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const canSend = question.trim().length >= 3 && !isSending;

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages, isSending]);

  const submit = async () => {
    const value = question.trim();
    if (value.length < 3 || isSending) return;

    setIsSending(true);
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");

    try {
      const response = await askChatbot(value);
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: response.answer,
      };
      setMessages((current) => [...current, assistantMessage]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to fetch chatbot response.";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={isOpen ? "Hide assistant" : "Open assistant"}
        className="fixed bottom-10 right-10 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/90 bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 text-white shadow-[0_16px_30px_-20px_rgba(12,74,110,0.95)] transition hover:brightness-105"
        onClick={() => setIsOpen((value) => !value)}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/35 p-4 backdrop-blur-sm sm:items-center sm:p-6">
          <aside className="flex h-[min(80vh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-cyan-200/70 bg-white/95 shadow-[0_30px_80px_-40px_rgba(12,74,110,0.95)]">
            <header className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-cyan-50/90 via-sky-50/80 to-blue-50/90 px-5 py-4">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Chat Board
                </p>
                <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                  Standup assistant
                </h3>
                <p className="text-xs text-slate-600">
                  Ask about blockers, mood, priorities, and daily standup context.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close assistant"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.9)_0%,rgba(241,245,249,0.6)_100%)] px-5 py-4">
              {messages.length === 0 ? (
                <div className="rounded-2xl border border-cyan-200/80 bg-cyan-50/70 px-4 py-3 text-sm text-slate-700">
                  Try asking: &quot;Show the latest standup update for Bhaumik.&quot;
                </div>
              ) : (
                messages.map((message) => (
                  <article
                    key={message.id}
                    className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-[0_16px_28px_-24px_rgba(15,23,42,0.6)] ${
                      message.role === "user"
                        ? "ml-auto border-cyan-200 bg-cyan-50 text-sky-900"
                        : "mr-auto border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </article>
                ))
              )}

              {isSending ? (
                <div className="mr-auto inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sky-500" />
                  <span className="ml-1">Thinking...</span>
                </div>
              ) : null}

              <div ref={messagesEndRef} />
            </div>

            <form
              className="border-t border-slate-200/80 bg-white/90 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="relative">
                <textarea
                  className="h-16 w-full resize-none rounded-2xl border border-slate-300/90 py-2 pl-3 pr-14 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey) return;
                    event.preventDefault();
                    if (canSend) {
                      void submit();
                    }
                  }}
                  placeholder="Ask about standup blockers, priorities, and team progress..."
                  disabled={isSending}
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!canSend}
                  className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Responses are grounded on standup and settings context.
              </p>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}
