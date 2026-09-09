"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Card, Input, Spinner, cx } from "@/components/ui";
import type { Conversation, ConversationDetail } from "@/lib/types";

export function ChatsView() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [detail, setDetail] = React.useState<ConversationDetail | null>(null);
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<{ data: Conversation[] }>("/api/admin/conversations", {}, true)
      .then((r) => setConversations(r.data))
      .catch((e) => setError((e as Error).message));
  }, []);

  React.useEffect(() => {
    const t = setInterval(() => {
      apiFetch<{ data: Conversation[] }>("/api/admin/conversations", {}, true)
        .then((r) => setConversations(r.data))
        .catch(() => undefined);
    }, 15000);
    return () => clearInterval(t);
  }, []);

  React.useEffect(() => {
    if (selectedId === null) return;
    apiFetch<{ data: ConversationDetail }>(`/api/admin/conversations/${selectedId}`, {}, true)
      .then((r) => setDetail(r.data))
      .catch((e) => setError((e as Error).message));
  }, [selectedId]);

  async function send() {
    if (!reply.trim() || !detail) return;
    setSending(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/conversations/${detail.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: reply.trim() }),
      }, true);
      setReply("");
      const r = await apiFetch<{ data: ConversationDetail }>(`/api/admin/conversations/${selectedId}`, {}, true);
      setDetail(r.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3 font-semibold text-slate-900">Conversaciones</div>
        <div className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
          {conversations.length === 0 && <p className="p-4 text-sm text-slate-400">Aún no hay conversaciones.</p>}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cx(
                "flex w-full flex-col items-start gap-1 px-4 py-3 text-left hover:bg-slate-50",
                selectedId === c.id && "bg-brand-50",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-semibold text-slate-800">{c.contact || c.wa_id}</span>
                <span className="text-xs text-slate-400">{c.updated_at?.slice(5, 16)}</span>
              </div>
              <span className="line-clamp-1 text-xs text-slate-500">{c.last_message}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        {!detail ? (
          <p className="text-sm text-slate-400">Selecciona una conversación.</p>
        ) : (
          <>
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{detail.contact?.name || detail.wa_id}</h3>
                <p className="text-xs text-slate-500">{detail.contact?.phone || detail.wa_id}</p>
              </div>
              <Badge kind={detail.status === "active" ? "green" : "gray"}>{detail.status}</Badge>
            </div>

            {detail.sessions?.length > 0 && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3">
                <p className="mb-1 text-xs font-semibold text-blue-800">Enlaces de reserva enviados</p>
                <div className="space-y-1 text-xs text-blue-900">
                  {detail.sessions.map((s) => (
                    <div key={s.token} className="flex flex-wrap items-center gap-2">
                      <span>{s.status}</span>
                      {s.service && <span>· {s.service}</span>}
                      {s.date && <span>· {s.date} {s.time || ""}</span>}
                      <a
                        href={`/reserva/${s.token}`}
                        target="_blank"
                        className="font-semibold underline"
                      >
                        abrir
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-[55vh] space-y-2 overflow-y-auto pb-2">
              {detail.messages?.map((m) => (
                <div key={m.id} className={cx("flex", m.direction === "in" ? "justify-start" : "justify-end")}>
                  <div
                    className={cx(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      m.direction === "in" ? "rounded-tl-sm bg-slate-100 text-slate-800" : "rounded-tr-sm bg-brand-600 text-white",
                    )}
                  >
                    {m.body}
                    <div className={cx("mt-1 text-[10px]", m.direction === "in" ? "text-slate-400" : "text-brand-100")}>
                      {m.created_at?.slice(0, 16)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Escribe una respuesta… (se enviará por WhatsApp)"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />
              <Button onClick={send} disabled={sending || !reply.trim()}>
                {sending ? <Spinner /> : "Enviar"}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}