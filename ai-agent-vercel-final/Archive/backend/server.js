import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import toursRoute from "./routes/tours.js";
import chatRoute from "./routes/chat.js";

// ES6 modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Routes
app.use("/api/tours", toursRoute);
app.use("/api/chat", chatRoute);

// Serve frontend for any route not starting with /api
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 العرّاب سيرفر شغال على: http://localhost:${PORT}`);
  console.log(`📊 API Tours: http://localhost:${PORT}/api/tours`);
  console.log(`💬 API Chat: http://localhost:${PORT}/api/chat`);
});
