import mongoose from 'mongoose';
import { config } from "./config.js"
import { seedDepartments } from './seed.js';

const connectDB = async () => {
   try {
      await mongoose.connect(config.MONGO_URI);
      await seedDepartments();
      console.log("MongoDB Connected successfully");
   } catch (error) {
      console.error(`Error connecting to MongoDB: ${error.message}`);
      process.exit(1);
   }
};

export default connectDB;