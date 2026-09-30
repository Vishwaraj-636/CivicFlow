import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

export const useIncidentSocket = (incidentId) => {
   const [messages, setMessages] = useState([]);
   const [connected, setConnected] = useState(false);

   useEffect(() => {
      if (!incidentId) return undefined;
      const socket = io(socketUrl, { withCredentials: true });
      socket.on("connect", () => {
         setConnected(true);
         socket.emit("incident:join", incidentId);
      });
      socket.on("disconnect", () => setConnected(false));
      socket.on("message:new", (message) => setMessages((current) => (
         current.some((item) => item._id === message._id) ? current : [...current, message]
      )));
      return () => {
         socket.emit("incident:leave", incidentId);
         socket.disconnect();
         setConnected(false);
      };
   }, [incidentId]);

   const sendMessage = (message) => new Promise((resolve, reject) => {
      const socket = io(socketUrl, { withCredentials: true });
      socket.on("connect", () => {
         socket.emit("message:send", { incidentId, message }, (response) => {
            socket.disconnect();
            if (response?.error) reject(new Error(response.error));
            else resolve(response.message);
         });
      });
      socket.on("connect_error", reject);
   });

   return { connected, messages, setMessages, sendMessage };
};
