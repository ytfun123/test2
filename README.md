# Chillcord

Warning: this is not the real Discord and is not intended to copy the real Discord.

Chillcord is a small realtime chat site with account signup, global chat, and friend direct messages.

## Make It A Public Site

GitHub Pages will not work for this app because people chatting together need a live Node server. Use Render, Railway, Fly.io, or another Node host.

### Deploy On Render

1. Go to https://render.com and sign in with GitHub.
2. Click **New** > **Blueprint**.
3. Select this repository: `ytfun123/discord`.
4. Render will read `render.yaml` automatically.
5. Click deploy.

After deploy, Render gives you a public URL. Share that URL with people and they can create accounts, add friends by username, use global chat, and DM friends.

## Run Locally

```bash
npm install
npm start
```

Open http://localhost:3000.

## What Was Fixed

The old version stored every account, friend, and message only in each browser's `localStorage`. That made global chat local to one browser and made friend lookup fail unless both accounts were created in the same browser.

This version adds a Node/Express + Socket.IO backend:

- users are shared through the server
- adding friends by username works across browsers/devices connected to the same server
- global chat messages are broadcast in realtime
- direct messages are stored per friend conversation
- messages and users persist to `data/db.json` on the server

If the backend is not running, the page still falls back to local demo storage so the UI remains usable.

## Important

The current storage is simple file storage on the server. It is okay for testing and small demos, but for a serious public chat site you should use a real database such as PostgreSQL, MongoDB, Firebase, or Supabase.
