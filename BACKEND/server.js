import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { createServer } from 'node:http';
import { attachSocketServer } from './src/socket/socket.server.js';
import { escalateOverdueComplaints } from './src/service/complaintEscalation.service.js';

dotenv.config();

const PORT = process.env.PORT

const startServer = async () => {
   try {
      await connectDB();
      await escalateOverdueComplaints();
      setInterval(() => {
         escalateOverdueComplaints().catch((error) => console.error("SLA escalation sweep failed:", error.message));
      }, 60 * 1000);
      const httpServer = createServer(app);
      app.set("io", attachSocketServer(httpServer));
      httpServer.listen(PORT, () => {
         console.log(`Server listening on port ${PORT}`);
      })
   }
   catch (err) {
      console.log("Failed to start server: ", err.message);
      process.exit(1);
   }
}

startServer();