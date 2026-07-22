const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const bodyParser = require("body-parser");

dotenv.config();

const { swaggerUi, swaggerSpec } = require("./swagger");

// ================== Here Import Routes=================

const userRoute = require("./routers/userRoutes");
const roleRoute = require("./routers/roleRoutes");
const userRoleRoute = require("./routers/userRoleRoutes");
const authRoute = require("./routers/authRoutes");
const permissionRoute = require("./routers/permissionRoutes");
const changePasswordRoutes = require("./routers/passwordChangeRoutes");

const floorRoutes = require("./routers/floorRoutes");
const officeRoutes = require("./routers/officeRoutes");
const signageRoutes = require("./routers/signageRoutes");
const settingsRoutes = require("./routers/settingsRoutes");
const announcementRoutes = require("./routers/announcementRoutes");

// const issueFileAttachmentRoutes = require("./routers/issueAttachmentRoutes");
// const fileAttachmentRoutes = require("./routers/attachementRoutes");

const app = express();
const appServer = http.createServer(app);

app.use(
  express.json({
    verify: (req, res, buf) => {
      if (!buf.length) return; // allow empty body
      try {
        JSON.parse(buf);
      } catch (e) {
        // Don't throw the error after sending response
        const error = new Error("Invalid JSON payload");
        error.status = 400;
        error.expose = true;
        throw error;
      }
    },
  })
);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// ===========Serve static files (PDFs, uploads)=====================
app.use(
  express.static(path.join(__dirname, "public"), {
    setHeaders: (res, filePath) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      if (filePath.endsWith(".pdf")) {
        res.set("Content-Disposition", "inline");
      }
    },
  })
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, filePath) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
    },
  })
);

// ================== CORS Configuration ==================
const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:4001",
  process.env.FRONTEND_URL,
];
const corsOptions = {
  origin: true, // Allow all origins for development
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// ================== Database Connection ==================
const { sequelize } = require("./models");
const { ensureAdminUser } = require("./utils/ensureAdminUser");

sequelize
  .authenticate()
  .then(async () => {
    console.log(" Database connected successfully");
    await ensureAdminUser();
  })
  .catch((err) => console.error(" Database connection error:", err));

// ================== Swagger Setup ==================
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ================== API Routes go here ==================

app.use("/api/users", userRoute);
app.use("/api/roles", roleRoute);
app.use("/api/user-roles", userRoleRoute);
app.use("/api/auth", authRoute);
app.use("/api/change-password", changePasswordRoutes);
app.use("/api/permissions", permissionRoute);

app.use("/api/floors", floorRoutes);
app.use("/api/offices", officeRoutes);
app.use("/api", signageRoutes);
app.use("/api", settingsRoutes);
app.use("/api", announcementRoutes);

// app.use("/api/issue-attachments", issueFileAttachmentRoutes);
// app.use("/api/attachments", fileAttachmentRoutes);

// ================== Root Endpoint ==================
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Minister Of Mines Office Guide API 🚀" });
});

// ================== Error Handler ==================
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================== Start App Server ==================
const appPort = process.env.PORT || 4001;
appServer.listen(appPort, () => {
  console.log(` App server running at http://localhost:${appPort}`);
});

// ================== Socket.IO Setup ==================
// A single Socket.IO instance is attached to the app HTTP server so kiosk pages
// and user clients share the same endpoint. A legacy standalone server is also
// spun up on SOCKET_PORT to keep any older clients working.
const io = new Server(appServer, {
  cors: corsOptions,
  path: "/socket.io",
});

const onlineUsers = new Map();

const attachSocketHandlers = (socketServerIo) => {
  socketServerIo.on("connection", (socket) => {
    const { userId } = socket.handshake.query || {};

    if (userId) {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} connected: ${socket.id}`);
    }

    // Every connected socket (admin users, public office-guide, appearance
    // preview, etc.) joins the broadcast room. Any admin edit fires an event
    // into this room so open pages refetch without a manual reload.
    socket.join("signage:all");

    socket.on("disconnect", () => {
      if (userId) onlineUsers.delete(userId);
    });
  });
};

attachSocketHandlers(io);

// Legacy: keep a standalone server on SOCKET_PORT for any older clients.
const legacySocketServer = http.createServer();
const legacyIo = new Server(legacySocketServer, { cors: corsOptions });
attachSocketHandlers(legacyIo);

const socketPort = process.env.SOCKET_PORT || 5001;
legacySocketServer.listen(socketPort, () => {
  console.log(`Socket.IO legacy server running at http://localhost:${socketPort}`);
});

// Make Socket.IO accessible from controllers via req.app.get("socketio").
// Both the main and legacy io instances need to fire so kiosks connected via
// either transport receive updates.
const broadcastIo = {
  to: (room) => ({
    emit: (event, payload) => {
      io.to(room).emit(event, payload);
      legacyIo.to(room).emit(event, payload);
    },
  }),
  emit: (event, payload) => {
    io.emit(event, payload);
    legacyIo.emit(event, payload);
  },
};
app.set("socketio", broadcastIo);

module.exports = { appServer, io, onlineUsers };

// Expose the server using
// cloudflared tunnel --url http://localhost:4001
