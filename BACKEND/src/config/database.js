import mongoose from 'mongoose';
import { config } from "./config.js"

const connectDB = async () => {
   try {
      await mongoose.connect(config.MONGO_URI);
      console.log("MongoDB Connected successfully");
   } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      process.exit(1);
   }
};

export default connectDB;