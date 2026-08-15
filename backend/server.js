const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const userRoutes = require("./routes/userRoutes");
const disasterRoutes = require("./routes/disasterRoutes");
const authMiddleware = require("./middleware/authMiddleware");
const { getDashboardStats } = require("./controllers/disasterController");
const { getPool } = require("./config/database");

const app = express();
const port = Number(process.env.PORT || 5000);
const frontendPath = path.resolve(__dirname, "../frontend");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(frontendPath));

app.get("/health", (_req, res) => {
  res.status(200).json({ message: "Server is running." });
});

app.use("/api/users", userRoutes);
app.use("/api/disasters", disasterRoutes);
app.get("/api/dashboard/stats", authMiddleware, getDashboardStats);

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.status(404).sendFile(path.join(frontendPath, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(port, async () => {
  console.log(`Server started on http://localhost:${port}`);
  try {
    await getPool();
  } catch (error) {
    console.error("Server started, but DB connection is not ready.");
  }
});
