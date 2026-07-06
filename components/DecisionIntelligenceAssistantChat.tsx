"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";

import { sendAssistantChatMessage } from "@/lib/api/assistant";
import type { AssistantChatMessage } from "@/types/assistant";

type Props = {
  employeeId: number;
};

const SUGGESTED_ATTRITION_DRIVERS_PROMPT =
  "Cuales son los factores que determinan el riesgo de fuga de este empleado?";

export function DecisionIntelligenceAssistantChat({ employeeId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);
    setOpen(false);
  }, [employeeId]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = async (presetMessage?: string) => {
    const message = (presetMessage ?? input).trim();
    if (!message || loading) return;

    const previousMessages = messages;
    const userMessage: AssistantChatMessage = {
      role: "user",
      content: message,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await sendAssistantChatMessage({
        employee_id: employeeId,
        message,
        conversation: previousMessages,
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo contactar con el asistente",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Abrir asistente de Decision Intelligence"
        title="Abrir asistente de Decision Intelligence"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[color:rgb(var(--rsm-blue-rgb)/0.25)] bg-[rgb(var(--rsm-blue-rgb)/0.08)] text-[var(--rsm-blue)] shadow-sm transition-colors hover:bg-[rgb(var(--rsm-blue-rgb)/0.14)] dark:border-[#79d7ff]/35 dark:text-[#79d7ff]"
      >
        <Bot className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[1px]">
          <aside className="flex h-full w-full max-w-[420px] flex-col border-l border-slate-200 bg-[var(--exec-card)] shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgb(var(--rsm-blue-rgb)/0.1)] text-[var(--rsm-blue)] dark:text-[#79d7ff]">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
                    Asistente de Decision Intelligence
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Empleado #{employeeId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Cerrar asistente"
                title="Cerrar asistente"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {messages.length === 0 ? (
                <div className="space-y-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <p>
                    Pregunta por el riesgo de fuga, los drivers SHAP del modelo
                    original o los factores que explican la prediccion.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSend(SUGGESTED_ATTRITION_DRIVERS_PROMPT)}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-[color:rgb(var(--rsm-blue-rgb)/0.25)] bg-[rgb(var(--rsm-blue-rgb)/0.08)] px-3 py-2 text-left text-sm font-medium text-[var(--rsm-blue)] transition-colors hover:bg-[rgb(var(--rsm-blue-rgb)/0.14)] dark:border-[#79d7ff]/35 dark:text-[#79d7ff]"
                  >
                    Cuales son los factores que determinan el riesgo de fuga de este empleado?
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message, index) => {
                    const isUser = message.role === "user";
                    return (
                      <div
                        key={`${message.role}-${index}`}
                        className={[
                          "flex",
                          isUser ? "justify-end" : "justify-start",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "max-w-[85%] whitespace-pre-line rounded-lg px-3 py-2 text-sm leading-6",
                            isUser
                              ? "bg-[var(--rsm-blue)] text-white"
                              : "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                          ].join(" ")}
                        >
                          {message.content}
                        </div>
                      </div>
                    );
                  })}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Pensando
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <footer className="border-t border-slate-200 p-4 dark:border-slate-700">
              {error && (
                <div className="mb-3 rounded-lg border border-[color:rgb(var(--rsm-red-rgb)/0.3)] bg-[rgb(var(--rsm-red-rgb)/0.1)] px-3 py-2 text-sm text-[var(--rsm-red)] dark:text-[#ff9ab8]">
                  {error}
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={2}
                  placeholder="Escribe una pregunta"
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[var(--rsm-blue)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="button"
                  aria-label="Enviar mensaje"
                  title="Enviar mensaje"
                  disabled={loading || !input.trim()}
                  onClick={() => void handleSend()}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--rsm-blue)] text-white transition-colors hover:bg-[#007db2] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
