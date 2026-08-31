import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/database.js';

dotenv.config();

const PORT = process.env.PORT

const startServer = async () => {
   try {
      await connectDB();
      app.listen(PORT, () => {
         console.log(`Server listening on port ${PORT}`);
      })
   }
   catch (err) {
      console.log("Failed to start server: ", err.message);
      process.exit(1);
   }
}

startServer();