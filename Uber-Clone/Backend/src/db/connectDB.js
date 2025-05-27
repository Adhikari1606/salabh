import mongoose from "mongoose";
export const connectDb = async () => {
    
    const mongoUrl = process.env.MONGO_URI;
    if (!mongoUrl) {
        console.error("MONGO_URL environment variable is not set.");
       
    }
    try {
        await mongoose.connect(mongoUrl);
        console.log('Connected to MongoDB');
    } catch (err) {
        console.log("error aa gyo bhaiya ",err)
    }
};
