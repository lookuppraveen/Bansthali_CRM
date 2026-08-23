"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";
import { AI_HOW, AI_PROMPTS, AI_STATS } from "@/lib/mock-data";

interface Msg {
  role: "user" | "assistant";
  content: string;
  citations?: { title: string; sourcePath: string }[];
  pending?: boolean;
  error?: string;
}

const BOOT: Msg = {
  role: "assistant",
  content:
    "Namaste! I'm the Banasthali Assistant. Ask me about admissions, BUAT, fees, hostel, safety or campus life — in English or Hindi.",
};

export function AiView() {
  const [msgs, setMsgs] = useState<Msg[]>([BOOT]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || sending) return;

    setDraft("");
    setSending(true);
    const history = msgs
      .filter((m) => !m.pending && !m.error)
      .slice(-8) // last 8 turns of context
      .map((m) => ({ role: m.role, content: m.content }));

    setMsgs((prev) => [
      ...prev,
      { role: "user", content: q },
      { role: "assistant", content: "", pending: true },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as {
        answer: string;
        citations: { title: string; sourcePath: string }[];
      };
      setMsgs((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        };
        return copy;
      });
    } catch (e) {
      setMsgs((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "",
          error: (e as Error).message,
        };
        return copy;
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="view">
      <div className="flex items-end gap-4 mb-5">
        <div className="flex-1">
          <div style={{ fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--color-accent)", marginBottom: 6 }}>
            Engagement · Retrieval-Augmented · Claude Haiku 4.5
          </div>
          <h2 style={{ margin: "0 0 4px" }}>Student AI Assistant</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: 14 }}>
            Grounded in approved university knowledge — accurate, cited and available 24×7 across web, portal, WhatsApp and mobile.
          </p>
        </div>
        <div className="flex gap-3.5">
          {AI_STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: 20, color: "var(--color-accent-700)" }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-5 items-start" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden", height: 560, display: "flex", flexDirection: "column" }}
        >
          <div
            className="flex items-center gap-2.5"
            style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-divider)" }}
          >
            <span
              className="w-[30px] h-[30px] grid place-items-center rounded-full"
              style={{
                background: "var(--color-accent-100)",
                border: "1px solid var(--color-accent)",
                color: "var(--color-accent-700)",
              }}
            >
              <Icon name="sparkles" size={15} />
            </span>
            <div>
              <div style={{ fontSize: 13.5, fontFamily: "var(--font-heading)" }}>Banasthali Assistant</div>
              <div style={{ fontSize: 10.5, color: "var(--color-accent-700)" }}>● Online · English &amp; हिंदी</div>
            </div>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto app-scroll"
            style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 14 }}
          >
            {msgs.map((m, idx) => {
              const bot = m.role === "assistant";
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: bot ? "flex-start" : "flex-end",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      maxWidth: "78%",
                      padding: "11px 14px",
                      borderRadius: bot ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      border: `1px solid ${bot ? "var(--color-divider)" : "var(--color-accent)"}`,
                      background: bot ? "var(--color-card)" : "var(--color-accent-100)",
                      color: "var(--color-text)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.pending ? (
                      <div className="flex items-center gap-2" style={{ color: "var(--color-muted)" }}>
                        <Icon name="loader" size={14} className="animate-spin" />
                        <span>Thinking…</span>
                      </div>
                    ) : m.error ? (
                      <div style={{ color: "#b4442e" }}>Sorry — {m.error}</div>
                    ) : (
                      <>
                        <div>{m.content}</div>
                        {m.citations && m.citations.length > 0 && (
                          <div
                            className="flex flex-wrap gap-1.5 mt-2 pt-2"
                            style={{
                              borderTop: "1px solid var(--color-divider)",
                            }}
                          >
                            {m.citations.map((c) => (
                              <span
                                key={c.sourcePath}
                                className="inline-flex items-center gap-1"
                                style={{
                                  fontSize: 10.5,
                                  color: "var(--color-accent-700)",
                                  border: "1px solid var(--color-accent-300)",
                                  borderRadius: 3,
                                  padding: "2px 7px",
                                }}
                                title={c.sourcePath}
                              >
                                <Icon name="book-open" size={11} />
                                {c.title.replace(/\s*—.*$/, "")}
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-divider)" }}>
            <div className="flex gap-1.5 mb-2.5 flex-wrap">
              {AI_PROMPTS.map((p) => (
                <span
                  key={p}
                  className="tag tag-outline"
                  style={{ cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.5 : 1 }}
                  onClick={() => !sending && send(p)}
                >
                  {p}
                </span>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask about admissions, fees, hostel…"
                className="input"
                style={{ flex: 1 }}
                disabled={sending}
              />
              <button type="submit" className="btn btn-primary" style={{ gap: 6 }} disabled={sending || !draft.trim()}>
                <Icon name="send" size={14} />
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="card">
            <h5 style={{ margin: "0 0 8px" }}>How it works</h5>
            {AI_HOW.map((h) => (
              <div key={h.title} className="flex gap-2.5" style={{ padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <Icon name={h.icon} size={17} style={{ color: "var(--color-accent)", marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13 }}>{h.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--color-muted)", lineHeight: 1.4 }}>{h.text}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="flex items-center gap-2.5">
              <Icon name="server" size={15} style={{ color: "var(--color-accent-700)" }} />
              <span style={{ fontSize: 12, color: "var(--color-muted)" }}>
                Backed by pgvector on Neon Postgres + Anthropic Claude Haiku 4.5 for generation and OpenAI
                text-embedding-3-small for retrieval. Answers only from approved university content.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
