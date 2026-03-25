import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // Real-time state for the canvas
  let canvasState: any[] = [];
  let cursors: Record<string, { x: number; y: number; name: string; color: string }> = {};

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send initial state
    socket.emit("canvas:init", canvasState);

    socket.on("canvas:update", (newState) => {
      canvasState = newState;
      socket.broadcast.emit("canvas:sync", newState);
    });

    socket.on("cursor:move", (data) => {
      cursors[socket.id] = data;
      socket.broadcast.emit("cursor:sync", { id: socket.id, ...data });
    });

    socket.on("disconnect", () => {
      delete cursors[socket.id];
      io.emit("cursor:remove", socket.id);
      console.log("User disconnected:", socket.id);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
