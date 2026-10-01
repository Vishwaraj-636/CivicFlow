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
      setPeopleError("");
      try {
         const response = await chatApi.get(`/chat/conversations/${user._id}`);
         setMessages(response.data.messages || []);
      } catch (error) {
         setPeopleError(error.response?.data?.error || "Unable to load this conversation.");
      }
   };

   useEffect(() => {
      if (!open || mode !== "people" || !selectedUser) return undefined;
      const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", { withCredentials: true });
      socketRef.current = socket;
      socket.on("connect", () => socket.emit("direct:join", selectedUser._id, (response) => {
         if (response?.error) setPeopleError(response.error);
      }));
      socket.on("direct:new", (message) => {
         if (String(message.senderId?._id || message.senderId) === String(selectedUser._id) || String(message.recipientId) === String(selectedUser._id)) {
            setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
         }
      });
      socket.on("connect_error", () => setPeopleError("Live chat is unavailable. Retrying with saved messages."));
      return () => {
         socket.disconnect();
         socketRef.current = null;
      };
   }, [open, mode, selectedUser]);

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
         {mode === "assistant" ? <div className="p-4"><div className="rounded-lg border border-[#D7E6E1] bg-[#F3F8F6] p-3"><p className="text-xs font-bold uppercase tracking-wider text-[#39756B]">Ask clearly</p><p className="mt-1 text-sm leading-5 text-[#52606D]">Try “show my complaint progress” or “who handles road repairs?”</p></div>{answer && <div className="mt-3 rounded-lg border border-[#D7E6E1] bg-white p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-[#39756B]">Assistant response</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#17202A]">{answer}</p>{sources.length > 0 && <p className="mt-3 border-t border-[#E2E6E4] pt-2 text-[11px] text-[#87919B]">Source: {sources.join(", ")}</p>}</div>}<form onSubmit={submit} className="mt-3 space-y-2"><textarea value={query} onChange={(event) => setQuery(event.target.value)} rows="3" placeholder="Ask about services, your complaints, or procedures" className="w-full rounded-lg border border-[#AFC5BD] p-3 text-sm outline-none focus:border-[#39756B] focus:ring-2 focus:ring-[#39756B]/20" /><button type="submit" disabled={loading || !query.trim()} className="w-full rounded-lg bg-[#173B5E] px-3 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Finding an answer..." : "Ask assistant"}</button></form></div> : <div className="p-4">
            {peopleError && <p className="mb-2 rounded-lg bg-[#FBF0F0] p-2 text-xs text-[#A44A4A]">{peopleError}</p>}
            {!selectedUser ? <>{peopleLoading ? <p className="text-sm text-[#52606D]">Loading contacts...</p> : users.length === 0 ? <p className="text-sm text-[#52606D]">No eligible contacts are available yet.</p> : <div className="max-h-56 space-y-2 overflow-y-auto">{users.map((user) => <button type="button" key={user._id} onClick={() => selectUser(user)} className="flex w-full items-center justify-between rounded-lg border border-[#E2E6E4] p-3 text-left hover:border-[#39756B]"><span><span className="block text-sm font-semibold text-[#17202A]">{user.fullname}</span><span className="block text-xs capitalize text-[#52606D]">{user.role === "dept_staff" ? "Department staff" : "Citizen"}</span></span><span className="text-xs font-semibold text-[#39756B]">Open chat →</span></button>)}</div>}</> : <><div className="mb-3 flex items-center justify-between border-b border-[#E2E6E4] pb-3"><div><button type="button" onClick={() => setSelectedUser(null)} className="text-xs font-semibold text-[#173B5E]">← All people</button><p className="mt-2 text-sm font-bold text-[#17202A]">{selectedUser.fullname}</p><p className="text-[11px] text-[#87919B]">{selectedUser.role === "dept_staff" ? "Department staff" : "Citizen"} · {socketRef.current?.connected ? "Live" : "Saved messages"}</p></div></div><div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-[#F7F7F5] p-3">{messages.length === 0 ? <p className="p-3 text-center text-xs text-[#87919B]">No messages yet. Start the conversation.</p> : messages.map((message) => { const mine = String(message.senderId?._id || message.senderId) === String(currentUser?._id || currentUser?.id); return <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-5 ${mine ? "rounded-br-sm bg-[#173B5E] text-white" : "rounded-bl-sm border border-[#D7E6E1] bg-white text-[#17202A]"}`}><p>{message.message}</p><p className={`mt-1 text-[10px] ${mine ? "text-[#CFE0EC]" : "text-[#87919B]"}`}>{mine ? "You" : selectedUser.fullname} · {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "now"}</p></div></div>; })}</div><form onSubmit={sendDirectMessage} className="mt-3 flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Write a message" className="min-w-0 flex-1 rounded-lg border border-[#CBD2CF] p-2 text-sm outline-none focus:border-[#39756B]" /><button type="submit" disabled={loading || !query.trim()} className="rounded-lg bg-[#39756B] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Send</button></form></>}
         </div>}
      </section>}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="rounded-full bg-[#39756B] px-4 py-3 text-sm font-semibold text-white shadow-lg">{open ? "Close chat" : "Chat / Assistant"}</button>
   </div>;
};

export default ChatWidget;
