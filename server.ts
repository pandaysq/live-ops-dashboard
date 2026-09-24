import { createServer } from "node:http";
import { Server } from "socket.io";
import express from "express";
import path from "node:path";
const app = express();
const publicDir = path.join(process.cwd(), "dist");
app.use(express.static(publicDir));
app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));
app.get("*", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);
const io = new Server(server, {
  path: "/api/socket.io",
  cors: { origin: true, credentials: true },
});

type Severity = "info" | "warning" | "success";
let startedAt = Date.now();
let sequence = 5;
let load = 42;
let connections = 1284;
const events = [
  { id: "5", timestamp: new Date().toISOString(), severity: "success" as Severity, service: "API Gateway", message: "Health check recovered" },
  { id: "4", timestamp: new Date(Date.now() - 45000).toISOString(), severity: "info" as Severity, service: "Telegram Worker", message: "Broadcast batch completed" },
  { id: "3", timestamp: new Date(Date.now() - 92000).toISOString(), severity: "warning" as Severity, service: "Parser Cluster", message: "Latency crossed 180 ms" },
];

function snapshot() {
  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    load,
    activeConnections: connections,
    servicesOnline: 7,
    servicesTotal: 8,
    events: events.slice(0, 20),
  };
}

io.on("connection", (socket) => {
  socket.emit("metrics:snapshot", snapshot());
});

setInterval(() => {
  load = Math.max(12, Math.min(94, load + Math.round((Math.random() - 0.48) * 12)));
  connections = Math.max(800, connections + Math.round((Math.random() - 0.45) * 70));
  if (Math.random() > 0.68) {
    const templates: Array<[Severity, string, string]> = [
      ["success", "Telegram Worker", "Queue drained successfully"],
      ["info", "API Gateway", "Traffic shifted to healthy replica"],
      ["warning", "Parser Cluster", "Response latency is elevated"],
      ["info", "Backup Service", "Incremental snapshot completed"],
    ];
    const [severity, service, message] = templates[Math.floor(Math.random() * templates.length)]!;
    events.unshift({ id: String(++sequence), timestamp: new Date().toISOString(), severity, service, message });
  }
  io.emit("metrics:snapshot", snapshot());
}, 3000);

server.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
