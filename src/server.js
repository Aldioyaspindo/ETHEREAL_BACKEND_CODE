import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/database.js";

// Load environment variables
dotenv.config();

// ========================================
// DATABASE CONNECTION
// ========================================
connectDB();

// ========================================
// SERVER CONFIGURATION
// ========================================
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ========================================
// START SERVER
// ========================================
const server = app.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`API URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});

// ========================================
// GRACEFUL SHUTDOWN
// ========================================
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

export default server;