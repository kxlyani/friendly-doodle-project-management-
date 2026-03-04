import mongoose from "mongoose";

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
