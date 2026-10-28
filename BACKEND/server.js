import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { createServer } from 'node:http';
import { attachSocketServer } from './src/socket/socket.server.js';
import { escalateOverdueComplaints } from './src/service/complaintEscalation.service.js';
import { getActivePresetName, DEFAULT_HISC_CONFIG } from './src/hisc/config.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

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
         console.log(`[HISC] Active configuration preset: ${getActivePresetName()} (duplicateThreshold: ${DEFAULT_HISC_CONFIG.duplicateThreshold}, relatedThreshold: ${DEFAULT_HISC_CONFIG.relatedThreshold})`);
      })
   }
   catch (err) {
      console.log("Failed to start server: ", err.message);
      process.exit(1);
   }
}

startServer();