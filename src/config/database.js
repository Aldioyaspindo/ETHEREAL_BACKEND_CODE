import mongoose from "mongoose";
import 'dotenv/config'; // Pastikan ini membaca file .env

const connectDB = async() => {
    try {        
        await mongoose.connect(process.env.MONGO_URI);
        console.log("database connected and running");
    } catch (error) {
        console.error(error.message);
        process.exit();
    }
};

export default connectDB;