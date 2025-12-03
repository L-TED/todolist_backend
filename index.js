import "dotenv/config";
import express from "express";
import cors from "cors";
import todolistsRouter from "./routes/todolists.js";
import subtasksRouter from "./routes/subtasks.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/todolists", todolistsRouter);
app.use("/api/subtasks", subtasksRouter);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Todo API Server" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
