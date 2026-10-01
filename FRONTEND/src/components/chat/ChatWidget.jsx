import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { queryIncidentCopilot } from "../../features/ai/services/ai.api";
import { useAuth } from "../../features/auth/hook/useAuth";

const chatApi = axios.create({ baseURL: "http://localhost:3000/api", withCredentials: true });

const ChatWidget = () => {
   const { user: currentUser } = useAuth();
   const [open, setOpen] = useState(false);
   const [mode, setMode] = useState("assistant");
   const [users, setUsers] = useState([]);
   const [selectedUser, setSelectedUser] = useState(null);
   const [messages, setMessages] = useState([]);
   const [peopleLoading, setPeopleLoading] = useState(false);
   const [peopleError, setPeopleError] = useState("");
   const [query, setQuery] = useState("");
   const [answer, setAnswer] = useState("");
   const [sources, setSources] = useState([]);
   const [loading, setLoading] = useState(false);
   const socketRef = useRef(null);
   const selectedUserRef = useRef(null);
   const [unreadByUser, setUnreadByUser] = useState({});

   const cacheKey = currentUser ? `civicflow-chat-${currentUser._id || currentUser.id}` : "";
   const readCache = () => {
      if (!cacheKey) return { messages: {}, unread: {} };
      try { return JSON.parse(localStorage.getItem(cacheKey)) || { messages: {}, unread: {} }; } catch { return { messages: {}, unread: {} }; }
   };
   const saveCache = (nextCache) => { if (cacheKey) localStorage.setItem(cacheKey, JSON.stringify(nextCache)); };
   const saveMessages = (userId, nextMessages) => { const cache = readCache(); cache.messages[userId] = nextMessages; saveCache(cache); };

   useEffect(() => {
      if (!currentUser) return undefined;
      const cache = readCache();
      setUnreadByUser(cache.unread || {});
      const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", { withCredentials: true });
      socketRef.current = socket;
      socket.on("connect", () => { if (selectedUserRef.current) socket.emit("direct:join", selectedUserRef.current._id); });
      socket.on("direct:new", (message) => {
         const senderId = String(message.senderId?._id || message.senderId);
         const recipientId = String(message.recipientId?._id || message.recipientId);
         const ownId = String(currentUser._id || currentUser.id);
         const incoming = recipientId === ownId;
         const conversationUserId = incoming ? senderId : recipientId;
         const activeUserId = String(selectedUserRef.current?._id || "");
         setMessages((current) => {
            if (activeUserId !== conversationUserId) return current;
            const nextMessages = current.some((item) => item._id === message._id) ? current : [...current, message];
            saveMessages(conversationUserId, nextMessages);
            return nextMessages;
         });
         if (incoming && activeUserId !== conversationUserId) {
            setUnreadByUser((current) => {
               const nextUnread = { ...current, [conversationUserId]: (current[conversationUserId] || 0) + 1 };
               const nextCache = readCache();
               nextCache.unread = nextUnread;
               saveCache(nextCache);
               window.dispatchEvent(new CustomEvent("civicflow:unread", { detail: nextUnread }));
               return nextUnread;
            });
         }
      });
      return () => { socket.disconnect(); socketRef.current = null; };
   }, [currentUser]);

   useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

   useEffect(() => {
      const openPeopleChat = () => { setOpen(true); setMode("people"); };
      window.addEventListener("civicflow:open-chat", openPeopleChat);
      return () => window.removeEventListener("civicflow:open-chat", openPeopleChat);
   }, []);

   useEffect(() => {
      if (!open || mode !== "people") return;
      setPeopleLoading(true);
      chatApi.get("/chat/users")
         .then((response) => setUsers(Array.isArray(response.data) ? response.data : []))
         .catch((error) => setPeopleError(error.response?.data?.error || "Unable to load available contacts."))
         .finally(() => setPeopleLoading(false));
   }, [open, mode]);

   const selectUser = async (user) => {
      setSelectedUser(user);
      selectedUserRef.current = user;
      setPeopleError("");
      const cache = readCache();
      setMessages(cache.messages[user._id] || []);
      const clearedUnread = { ...unreadByUser, [user._id]: 0 };
      setUnreadByUser(clearedUnread);
      cache.unread = clearedUnread;
      saveCache(cache);
      window.dispatchEvent(new CustomEvent("civicflow:unread", { detail: clearedUnread }));
      socketRef.current?.emit("direct:join", user._id);
      try {
         const response = await chatApi.get(`/chat/conversations/${user._id}`);
         const nextMessages = response.data.messages || [];
         setMessages(nextMessages);
         saveMessages(user._id, nextMessages);
      } catch (error) {
         setPeopleError(error.response?.data?.error || "Unable to load this conversation.");
      }
   };


   const submit = async (event) => {
      event.preventDefault();
      if (!query.trim()) return;
      setLoading(true);
      try {
         const response = await queryIncidentCopilot(query.trim());
         setAnswer(response.answer || "I could not find a grounded answer.");
         setSources(response.sources || []);
         setQuery("");
      } catch (error) {
         setAnswer(error.response?.data?.error || "The assistant could not reach the CivicFlow service. You can continue using the portal.");
         setSources([]);
      } finally {
         setLoading(false);
      }
   };

   const sendDirectMessage = async (event) => {
      event.preventDefault();
      if (!selectedUser || !query.trim()) return;
      setLoading(true);
      try {
         const cleanMessage = query.trim();
         if (socketRef.current?.connected) {
            await new Promise((resolve, reject) => socketRef.current.emit("direct:send", { recipientId: selectedUser._id, message: cleanMessage }, (response) => response?.error ? reject(new Error(response.error)) : resolve(response)));
         } else {
            const response = await chatApi.post(`/chat/conversations/${selectedUser._id}/messages`, { message: cleanMessage });
            setMessages((current) => current.some((item) => item._id === response.data.message._id) ? current : [...current, response.data.message]);
         }
         setQuery("");
      } catch (error) {
         setPeopleError(error.response?.data?.error || "Message could not be sent.");
      } finally {
         setLoading(false);
      }
   };

   return <div className="fixed bottom-5 right-5 z-50">
      {open && <section className="mb-3 w-[min(25rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#BFD9D0] bg-white shadow-2xl" aria-label="CivicFlow chat">
         <div className="bg-[#173B5E] px-5 py-4 text-white"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#B9E1D4]">CivicFlow service desk</p><h2 className="mt-1 text-lg font-bold">Chat with CivicFlow</h2><p className="mt-1 text-xs text-[#D8E6F0]">Get records, procedures, or people help</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="text-xl text-white/80 hover:text-white">x</button></div></div>
         <div className="border-b border-[#E2E6E4] bg-[#F7FAF9] p-3"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setMode("assistant")} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "assistant" ? "bg-[#39756B] text-white shadow-sm" : "bg-white text-[#52606D]"}`}>AI Assistant</button><button type="button" onClick={() => setMode("people")} className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "people" ? "bg-[#39756B] text-white shadow-sm" : "bg-white text-[#52606D]"}`}>People</button></div></div>
         {mode === "assistant" ? <div className="p-4 text-[#17202A]"><div className="rounded-lg border border-[#BFD9D0] bg-[#EAF5F1] p-3"><p className="text-xs font-bold uppercase tracking-wider text-[#23665B]">Ask clearly</p><p className="mt-1 text-sm leading-5 text-[#30434D]">Try “show my complaint progress” or “who handles road repairs?”</p></div>{answer && <div className="mt-3 rounded-lg border border-[#BFD9D0] bg-white p-3 text-[#17202A]"><p className="text-[10px] font-bold uppercase tracking-wider text-[#23665B]">Assistant response</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#17202A]">{answer}</p>{sources.length > 0 && <p className="mt-3 border-t border-[#D8E5E1] pt-2 text-[11px] text-[#52606D]">Source: {sources.join(", ")}</p>}</div>}<form onSubmit={submit} className="mt-3 space-y-2"><textarea value={query} onChange={(event) => setQuery(event.target.value)} rows="3" placeholder="Ask about services, your complaints, or procedures" className="w-full bg-white text-[#17202A] placeholder:text-[#52606D] rounded-lg border border-[#7E9E94] p-3 text-sm outline-none focus:border-[#23665B] focus:ring-2 focus:ring-[#39756B]/20" /><button type="submit" disabled={loading || !query.trim()} className="w-full rounded-lg bg-[#173B5E] px-3 py-2.5 text-sm font-bold text-white hover:bg-[#0F2942] disabled:cursor-not-allowed disabled:bg-[#8DA1B2] disabled:text-white">{loading ? "Finding an answer..." : "Ask assistant"}</button></form></div> : <div className="p-4 text-[#17202A]">
            {peopleError && <p className="mb-2 rounded-lg bg-[#FBF0F0] p-2 text-xs text-[#A44A4A]">{peopleError}</p>}
            {!selectedUser ? <>{peopleLoading ? <p className="text-sm text-[#52606D]">Loading contacts...</p> : users.length === 0 ? <p className="text-sm text-[#52606D]">No eligible contacts are available yet.</p> : <div className="max-h-56 space-y-2 overflow-y-auto">{users.map((user) => <button type="button" key={user._id} onClick={() => selectUser(user)} className="flex w-full items-center justify-between rounded-lg border border-[#E2E6E4] p-3 text-left hover:border-[#39756B]"><span><span className="block text-sm font-semibold text-[#17202A]">{user.fullname}</span><span className="block text-xs capitalize text-[#52606D]">{user.role === "dept_staff" ? "Department staff" : "Citizen"}</span></span><span className="text-xs font-semibold text-[#39756B]">Open chat →</span></button>)}</div>}</> : <><div className="mb-3 flex items-center justify-between border-b border-[#E2E6E4] pb-3"><div><button type="button" onClick={() => setSelectedUser(null)} className="text-xs font-semibold text-[#173B5E]">← All people</button><p className="mt-2 text-sm font-bold text-[#17202A]">{selectedUser.fullname}</p><p className="text-[11px] text-[#87919B]">{selectedUser.role === "dept_staff" ? "Department staff" : "Citizen"} · {socketRef.current?.connected ? "Live" : "Saved messages"}</p></div></div><div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-[#F7F7F5] p-3">{messages.length === 0 ? <p className="p-3 text-center text-xs text-[#87919B]">No messages yet. Start the conversation.</p> : messages.map((message) => { const mine = String(message.senderId?._id || message.senderId) === String(currentUser?._id || currentUser?.id); return <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-5 ${mine ? "rounded-br-sm bg-[#173B5E] text-white" : "rounded-bl-sm border border-[#D7E6E1] bg-white text-[#17202A]"}`}><p>{message.message}</p><p className={`mt-1 text-[10px] ${mine ? "text-[#CFE0EC]" : "text-[#87919B]"}`}>{mine ? "You" : selectedUser.fullname} · {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now"}</p></div></div>; })}</div><form onSubmit={sendDirectMessage} className="mt-3 flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 rounded-lg border border-[#CBD2CF] p-2 text-sm outline-none focus:border-[#39756B]" /><button type="submit" disabled={loading || !query.trim()} className="rounded-lg bg-[#39756B] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Send</button></form></>}
         </div>}
      </section>}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="rounded-full bg-[#39756B] px-4 py-3 text-sm font-semibold text-white shadow-lg">{open ? "Close chat" : "Chat / Assistant"}</button>
   </div>;
};

export default ChatWidget;
