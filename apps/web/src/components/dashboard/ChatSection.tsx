"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export function ChatSection({ currentUser }: { currentUser: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activePeer, setActivePeer] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function loadConversations() {
    const data = await apiFetch("/users/chat/conversations").catch(() => []);
    setConversations(data);
  }

  async function searchUsers(q: string) {
    const data = await apiFetch(`/users/chat/search?q=${encodeURIComponent(q)}`).catch(() => []);
    setSearchResults(data);
  }

  async function openChatWithPeer(peer: any) {
    setActivePeer(peer);
    const msgs = await apiFetch(`/users/chat/messages/${peer.id}`).catch(() => []);
    setMessages(msgs);
    loadConversations();
  }

  useEffect(() => {
    loadConversations();
    searchUsers("");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Har 4 soniyada faol chat xabarlarini yangilab turish
  useEffect(() => {
    if (!activePeer) return;
    const interval = setInterval(async () => {
      const msgs = await apiFetch(`/users/chat/messages/${activePeer.id}`).catch(() => []);
      setMessages(msgs);
    }, 4000);
    return () => clearInterval(interval);
  }, [activePeer]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activePeer) return;
    const msgText = text;
    setText("");
    setSending(true);
    try {
      const sent = await apiFetch(`/users/chat/messages/${activePeer.id}`, {
        method: "POST",
        body: JSON.stringify({ text: msgText }),
      });
      setMessages((prev) => [...prev, sent]);
      loadConversations();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden grid md:grid-cols-12 min-h-[580px]">
      {/* Chap panel: Qidiruv va Suhbatlar */}
      <div className="md:col-span-4 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b bg-white space-y-2">
          <h3 className="font-extrabold text-base text-slate-900">Muloqot va Qidiruv</h3>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="@username, ism yoki KY-ID qidirish..."
            className="w-full px-3.5 py-2 rounded-xl border bg-slate-50 focus:bg-white text-xs outline-none focus:border-[#5A4FE3]"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {/* Oxirgi suhbatlar */}
          {conversations.length > 0 && !searchQuery && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Oxirgi suhbatlar</div>
              {conversations.map((conv) => (
                <button
                  key={conv.peer.id}
                  onClick={() => openChatWithPeer(conv.peer)}
                  className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition ${
                    activePeer?.id === conv.peer.id ? "bg-[#EEF2FF]" : "hover:bg-white"
                  }`}
                >
                  {conv.peer.profile?.avatarUrl ? (
                    <img src={conv.peer.profile.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#5A4FE3] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {conv.peer.profile?.firstName?.[0] || "U"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-slate-900 truncate">
                        {conv.peer.profile?.firstName} {conv.peer.profile?.lastName}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#5A4FE3] text-white text-[10px] font-bold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5A4FE3] font-semibold">@{conv.peer.username}</div>
                    <div className="text-[11px] text-slate-400 truncate">{conv.lastMessage}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Barcha o'quvchi va o'qituvchilar ro'yxati */}
          <div className="p-2">
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
              {searchQuery ? "Qidiruv natijalari" : "O‘qituvchi va O‘quvchilar"}
            </div>
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => openChatWithPeer(u)}
                className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition ${
                  activePeer?.id === u.id ? "bg-[#EEF2FF]" : "hover:bg-white"
                }`}
              >
                {u.profile?.avatarUrl ? (
                  <img src={u.profile.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-[#5A4FE3] font-extrabold text-xs flex items-center justify-center shrink-0">
                    {u.profile?.firstName?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {u.profile?.firstName} {u.profile?.lastName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200/70 text-[10px] font-bold text-slate-600">
                      {u.role === "TEACHER" ? "Ustoz" : "O‘quvchi"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    @{u.username} · {u.publicId}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* O'ng panel: Xabarlashuv oynasi */}
      <div className="md:col-span-8 flex flex-col bg-white">
        {activePeer ? (
          <>
            <div className="p-4 border-b flex items-center justify-between bg-slate-50/40">
              <div className="flex items-center gap-3">
                {activePeer.profile?.avatarUrl ? (
                  <img src={activePeer.profile.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#5A4FE3] text-white font-bold flex items-center justify-center">
                    {activePeer.profile?.firstName?.[0] || "U"}
                  </div>
                )}
                <div>
                  <div className="font-extrabold text-sm text-slate-900">
                    {activePeer.profile?.firstName} {activePeer.profile?.lastName}
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="text-[#5A4FE3] font-bold">@{activePeer.username}</span> · ID: {activePeer.publicId} ·{" "}
                    {activePeer.role === "TEACHER" ? "O‘qituvchi" : "O‘quvchi"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/60 max-h-[420px]">
              {messages.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-16">
                  Suhbatni boshlash uchun quyida xabar yozing!
                </div>
              )}
              {messages.map((m) => {
                const isMine = m.senderId === currentUser.id;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                      isMine
                        ? "bg-[#5A4FE3] text-white ml-auto rounded-br-xs"
                        : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                    }`}
                  >
                    <div>{m.text}</div>
                    <div className={`text-[10px] mt-1 text-right ${isMine ? "text-indigo-200" : "text-slate-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t flex gap-2 bg-white">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Xabar yozing..."
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-[#5A4FE3]"
              />
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-2.5 rounded-xl bg-[#5A4FE3] hover:bg-[#4338CA] text-white font-bold text-sm transition"
              >
                Yuborish
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] text-[#5A4FE3] flex items-center justify-center text-2xl mb-3">
              💬
            </div>
            <div className="font-bold text-slate-700 text-sm">Muloqotni boshlang</div>
            <p className="text-xs max-w-xs mt-1">
              Chap tarafdan o‘qituvchi yoki o‘quvchini <strong>@username</strong>, ismi yoki <strong>KY-ID</strong> orqali toping va xabar yozing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}