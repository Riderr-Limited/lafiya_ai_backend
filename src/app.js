const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const path = require("path");

const connectDB = require("./config/db");
const socketHandler = require("./config/socket");
require("./config/firebase");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

// Route imports
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const communityRoutes = require("./routes/community.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const doctorRoutes = require("./routes/doctor.routes");
const hospitalRoutes = require("./routes/hospital.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const healthRecordRoutes = require("./routes/healthrecord.routes");
const aiRoutes = require("./routes/ai.routes");
const notificationRoutes = require("./routes/notification.routes");
const medicationRoutes = require("./routes/medication.routes");
const pregnancyRoutes = require("./routes/pregnancy.routes");
const campaignRoutes = require("./routes/campaign.routes");
const emergencyRoutes = require("./routes/emergency.routes");
const adminRoutes = require("./routes/admin.routes");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Connect to DB
connectDB();

// Socket.io
const allowedOrigins = [process.env.CLIENT_URL, "https://lafiya-ai-alpha.vercel.app"].filter(Boolean);
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
const io = new Server(server, {
  cors: { origin: allowedOrigins.length ? allowedOrigins : "*", methods: ["GET", "POST", "OPTIONS"] },
});
socketHandler(io);
app.set("io", io);

// Security Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.options("/*", cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "HealthCommunity API is running", timestamp: new Date() })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/health-records", healthRecordRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/pregnancy", pregnancyRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/admin", adminRoutes);

// Error Handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));

module.exports = { app, server };