const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "db.json");

const emptyState = {
  users: [],
  friends: {},
  messages: { global: [] }
};

let state = loadState();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/api/state", (req, res) => {
  res.json(publicState());
});

app.post("/api/signup", (req, res) => {
  const username = clean(req.body.username);
  const password = String(req.body.password || "");

  if (username.length < 3) return sendError(res, 400, "Username must be at least 3 characters");
  if (password.length < 6) return sendError(res, 400, "Password must be at least 6 characters");
  if (state.users.some(user => sameName(user.username, username))) {
    return sendError(res, 409, "Username already exists");
  }

  const user = {
    id: makeId("USER"),
    username,
    password,
    createdAt: new Date().toISOString()
  };

  state.users.push(user);
  state.friends[user.id] = [];
  persistAndBroadcast();
  res.status(201).json(safeUser(user));
});

app.post("/api/signin", (req, res) => {
  const username = clean(req.body.username);
  const password = String(req.body.password || "");
  const user = state.users.find(item => sameName(item.username, username) && item.password === password);

  if (!user) return sendError(res, 401, "Invalid username or password");
  res.json(safeUser(user));
});

app.post("/api/friends", (req, res) => {
  const user = state.users.find(item => item.id === req.body.userId);
  const friend = state.users.find(item => sameName(item.username, clean(req.body.username)));

  if (!user) return sendError(res, 401, "Sign in again before adding friends");
  if (!friend || friend.id === user.id) return sendError(res, 404, "User not found");

  state.friends[user.id] ||= [];
  state.friends[friend.id] ||= [];

  if (state.friends[user.id].includes(friend.id)) {
    return sendError(res, 409, "Already friends");
  }

  state.friends[user.id].push(friend.id);
  state.friends[friend.id].push(user.id);
  persistAndBroadcast();
  res.json(publicState());
});

app.post("/api/messages", (req, res) => {
  const user = state.users.find(item => item.id === req.body.userId);
  const conversationId = cleanConversationId(req.body.conversationId);
  const text = clean(req.body.text);

  if (!user) return sendError(res, 401, "Sign in again before sending messages");
  if (!text) return sendError(res, 400, "Message cannot be empty");
  if (!canUseConversation(user.id, conversationId)) {
    return sendError(res, 403, "You can only message global chat or your friends");
  }

  state.messages[conversationId] ||= [];
  state.messages[conversationId].push({
    id: makeId("MSG"),
    userId: user.id,
    conversationId,
    text: text.slice(0, 1000),
    timestamp: new Date().toISOString()
  });

  persistAndBroadcast();
  res.json(publicState());
});

io.on("connection", socket => {
  socket.emit("state", publicState());
});

server.listen(PORT, () => {
  console.log(`Chillcord running on http://localhost:${PORT}`);
});

function loadState() {
  try {
    if (!fs.existsSync(dbFile)) return structuredClone(emptyState);
    const parsed = JSON.parse(fs.readFileSync(dbFile, "utf8"));
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      friends: parsed.friends && typeof parsed.friends === "object" ? parsed.friends : {},
      messages: parsed.messages && typeof parsed.messages === "object" ? parsed.messages : { global: [] }
    };
  } catch (error) {
    console.error("Could not load db.json:", error);
    return structuredClone(emptyState);
  }
}

function saveState() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(dbFile, JSON.stringify(state, null, 2));
}

function persistAndBroadcast() {
  saveState();
  io.emit("state", publicState());
}

function publicState() {
  return {
    users: state.users.map(safeUser),
    friends: state.friends,
    messages: state.messages
  };
}

function safeUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  };
}

function sendError(res, status, error) {
  res.status(status).json({ error });
}

function clean(value) {
  return String(value || "").trim();
}

function sameName(left, right) {
  return clean(left).toLowerCase() === clean(right).toLowerCase();
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

function cleanConversationId(value) {
  const conversationId = clean(value);
  if (conversationId === "global") return conversationId;
  return conversationId.split(":").sort().join(":");
}

function canUseConversation(userId, conversationId) {
  if (conversationId === "global") return true;
  const members = conversationId.split(":");
  if (members.length !== 2 || !members.includes(userId)) return false;
  const otherId = members.find(id => id !== userId);
  return Boolean(otherId && state.friends[userId]?.includes(otherId));
}
