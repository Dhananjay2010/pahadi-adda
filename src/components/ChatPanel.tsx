"use client";

import { useEffect, useRef, useState } from "react";
import { useChat, readNickname, saveNickname } from "@/hooks/useChat";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 || 12;
  return `${h12}:${m < 10 ? "0" : ""}${m}${ampm}`;
}

export default function ChatPanel() {
  const { messages, configured, canSend, sendMessage, error } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  // Safe to read localStorage in the initializer: ChatPanel only ever
  // renders inside the ssr:false PahadiAdda tree, so there's no server
  // render to mismatch against.
  const [nickname, setNickname] = useState(readNickname);
  const [editingName, setEditingName] = useState(false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const lastCountRef = useRef(0);

  useEffect(() => {
    if (messages.length > lastCountRef.current) {
      if (!isOpen) setUnread((u) => u + (messages.length - lastCountRef.current));
    }
    lastCountRef.current = messages.length;
    if (isOpen) listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  function handleOpen() {
    setIsOpen(true);
    setUnread(0);
  }

  function handleSaveName(name: string) {
    const trimmed = name.trim() || nickname;
    setNickname(trimmed);
    saveNickname(trimmed);
    setEditingName(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !canSend) return;
    const sent = await sendMessage(draft, nickname);
    if (sent) setDraft("");
  }

  if (!configured) return null;

  return (
    <>
      {!isOpen && (
        <button
          className="chat-fab"
          onClick={handleOpen}
          data-tip="सबसे बात करें"
          aria-label="चैट खोलें"
        >
          <ChatIcon />
          {unread > 0 && <span className="chat-badge">{unread > 9 ? "9+" : unread}</span>}
        </button>
      )}

      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>अड्डे की बातें</span>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              data-tip="चैट बंद करें"
              aria-label="चैट बंद करें"
            >
              ✕
            </button>
          </div>

          <div className="chat-list" ref={listRef}>
            {messages.length === 0 && (
              <div className="chat-empty">अभी कोई बात नहीं हुई — पहला नमस्ते आपकी तरफ़ से?</div>
            )}
            {messages.map((m) => (
              <div className="chat-msg" key={m.id}>
                <div className="chat-msg-meta">
                  <b>{m.author}</b>
                  {m.place && <span className="chat-msg-place"> · {m.place}</span>}
                  <span className="chat-msg-time"> · {timeLabel(m.created_at)}</span>
                </div>
                <div className="chat-msg-content">{m.content}</div>
              </div>
            ))}
          </div>

          <div className="chat-name-row">
            {editingName ? (
              <input
                autoFocus
                className="chat-name-input"
                defaultValue={nickname}
                maxLength={30}
                onBlur={(e) => handleSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName(e.currentTarget.value);
                }}
              />
            ) : (
              <button
              className="chat-name-btn"
              onClick={() => setEditingName(true)}
              data-tip="अपना नाम बदलें"
            >
                आप: <b>{nickname}</b> (बदलें)
              </button>
            )}
          </div>

          {error && <div className="chat-error">भेजने में समस्या हुई: {error}</div>}

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              className="chat-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="कुछ लिखें…"
              maxLength={300}
            />
            <button
              className="chat-send"
              type="submit"
              disabled={!draft.trim() || !canSend}
              data-tip="संदेश भेजें (Enter)"
              aria-label="भेजें"
            >
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
