import dotenv from 'dotenv';
dotenv.config();

import app from "./src/app.js"
import connectDB from './src/config/database.js';

const PORT = process.env.PORT || 8000

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();