import mongoose from "mongoose";

import dns from "node:dns/promises";   
dns.setServers(["1.1.1.1", "1.0.0.1"]); 

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    // console.log("✅ Connected to MongoDB !!");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:");
    console.error(error); 
    process.exit(1);
  }
};

export default connectDB;
