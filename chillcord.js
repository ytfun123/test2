const crypto = require("crypto");

const DB_KEY = "chillcord:state";
const emptyState = {
  users: [],
  friends: {},
  messages: { global: [] }
};

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const action = req.method === "GET" ? req.query.action || "state" : req.body?.action;
    const state = await loadState();

    if (action === "state") {
      return res.status(200).json(publicState(state));
    }

    if (req.method !== "POST") {
      return sendError(res, 405, "Use POST for this action");
    }

    if (action === "signup") {
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
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
      };

      state.users.push(user);
      state.friends[user.id] = [];
      await saveState(state);
      return res.status(201).json(safeUser(user));
    }

    if (action === "signin") {
      const username = clean(req.body.username);
      const password = String(req.body.password || "");
      const user = state.users.find(item => sameName(item.username, username) && checkPassword(item, password));

      if (!user) return sendError(res, 401, "Invalid username or password");
      return res.status(200).json(safeUser(user));
    }

    if (action === "addFriend") {
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
      await saveState(state);
      return res.status(200).json(publicState(state));
    }

    if (action === "sendMessage") {
      const user = state.users.find(item => item.id === req.body.userId);
      const conversationId = cleanConversationId(req.body.conversationId);
      const text = clean(req.body.text);

      if (!user) return sendError(res, 401, "Sign in again before sending messages");
      if (!text) return sendError(res, 400, "Message cannot be empty");
      if (!canUseConversation(state, user.id, conversationId)) {
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

      state.messages[conversationId] = state.messages[conversationId].slice(-200);
      await saveState(state);
      return res.status(200).json(publicState(state));
    }

    return sendError(res, 404, "Unknown action");
  } catch (error) {
    if (error.message === "REDIS_NOT_CONFIGURED") {
      return sendError(res, 503, "Connect a Redis database in Vercel Marketplace first");
    }

    console.error(error);
    return sendError(res, 500, "Server error");
  }
};

async function loadState() {
  const result = await redisCommand(["GET", DB_KEY]);
  if (!result) return structuredClone(emptyState);

  try {
    const parsed = typeof result === "string" ? JSON.parse(result) : result;
    return normalizeState(parsed);
  } catch {
    return structuredClone(emptyState);
  }
}

async function saveState(state) {
  await redisCommand(["SET", DB_KEY, JSON.stringify(normalizeState(state))]);
}

async function redisCommand(command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) throw new Error("REDIS_NOT_CONFIGURED");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Redis request failed");
  return data.result;
}

function normalizeState(value) {
  return {
    users: Array.isArray(value?.users) ? value.users : [],
    friends: value?.friends && typeof value.friends === "object" ? value.friends : {},
    messages: value?.messages && typeof value.messages === "object" ? value.messages : { global: [] }
  };
}

function publicState(state) {
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
  return `${prefix}_${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function checkPassword(user, password) {
  return user.passwordHash === hashPassword(password) || user.password === password;
}

function cleanConversationId(value) {
  const conversationId = clean(value);
  if (conversationId === "global") return conversationId;
  return conversationId.split(":").sort().join(":");
}

function canUseConversation(state, userId, conversationId) {
  if (conversationId === "global") return true;
  const members = conversationId.split(":");
  if (members.length !== 2 || !members.includes(userId)) return false;
  const otherId = members.find(id => id !== userId);
  return Boolean(otherId && state.friends[userId]?.includes(otherId));
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
