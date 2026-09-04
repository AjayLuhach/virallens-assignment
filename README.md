# ViralLens — AI Customer Support Agent

A small, production-shaped support console: users sign up, chat with an AI support agent, switch
between eight open models mid-conversation, and come back later to a full, user-scoped history of
everything they asked.

Built for the **Minimal AI Customer Support Agent** full-stack challenge — JWT auth with bcrypt,
an Express + TypeScript API over MongoDB via Mongoose, a React + Tailwind chat UI, and
`docker compose up`.

> **Deployed link:** **http://13.222.147.66** — single EC2 instance (Ubuntu 24.04, t2.micro,
> us-east-1), nginx serving the built SPA on port 80 and reverse-proxying `/auth`, `/chat` and
> `/health` to the Node API on `127.0.0.1:4000`. The instance has no Elastic IP, so this address
> changes if it is stopped and started.

---

## What's built

| Requirement | Status | Where |
|---|---|---|
| Signup / login / logout with JWT | Done | `server/src/services/auth.service.ts` |
| Passwords hashed with bcrypt | Done | 10 salt rounds, hash never leaves the repository layer |
| Protected routes | Done | `server/src/middleware/auth.ts` (`requireAuth`) |
| Chat input + AI responses | Done | `client/src/pages/ChatPage.tsx` |
| History saved in MongoDB, user-scoped | Done | Mongoose `Conversation` + `Message` models, every query filtered by `userId` |
| Past conversations listed | Done | `client/src/components/ConversationList.tsx` |
| React chat UI with `fetch` | Done | `client/src/api/client.ts`, `credentials: 'include'` |
| Dockerised, `docker compose up` | Done | `docker-compose.yml` |
| **Bonus** — typing indicator | Done | animated three-dot bubble while the model is thinking |
| **Bonus** — rate limiting | Done | `express-rate-limit`, 20/15min on `/auth`, 30/min on `/chat/send` |
| **Bonus** — dev/prod config switching | Done | `NODE_ENV` drives cookie `secure`/`sameSite` and CORS |
| **Extra** — model selector | Done | 8 open models, grouped by vendor, server-side allow-list |

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18, Vite 5, TypeScript, Tailwind 3, react-router-dom 6 | Fast dev server, no runtime CSS cost |
| Backend | Node 20, Express 4, TypeScript (ESM) | Boring, well-understood, easy to review |
| Database | MongoDB (Atlas) with **Mongoose 8** | Schemas document every document shape in one place and validate under zod |
| Auth | `jsonwebtoken` (HS256) + `bcryptjs`, delivered as an httpOnly cookie | Token never reachable from JS |
| Validation | `zod` at the controller boundary | One place where untrusted input becomes typed |
| AI | OpenAI-compatible Bedrock gateway, plain `fetch` | No SDK, no SigV4, no vendor lock-in |

---

## Architecture

```
                       Browser (React + Tailwind)
                                 │
                 credentials: 'include'  ·  httpOnly cookie `token`
                                 │
                       nginx :8080  (SPA + /auth, /chat proxy)
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                        Express :4000                            │
│                                │                                │
│   router      auth.router.ts  ·  chat.router.ts                 │
│      │        paths, rate limits, requireAuth, try/catch → next │
│      ▼                                                          │
│   controller  zod safeParse → status code + { success, data }   │
│      │        no mongo, no bcrypt, no fetch                     │
│      ▼                                                          │
│   service     bcrypt · JWT · Bedrock call · orchestration       │
│      │        never sees req or res                             │
│      ▼                                                          │
│   repository  the only code that touches db.collection(...)     │
└────────────────────────────────┼────────────────────────────────┘
                                 │
                          MongoDB :27017
                  users · conversations · messages
```

### Why these four layers

Each layer has exactly one reason to change, so a change lands in one file instead of five.

| Layer | Owns | Never does |
|---|---|---|
| **router** | Paths, middleware order, rate limits, `try/catch → next(err)` | Business logic of any kind |
| **controller** | `zod.safeParse` of body/params, HTTP status codes, the `{ success, data }` envelope | Talk to Mongo, hash passwords, call the model |
| **service** | Business rules — bcrypt, JWT signing, prompt assembly, the Bedrock call | Touch `req`/`res`; it is callable from a script or a queue worker |
| **repository** | Every Mongoose query, `ObjectId` conversion, mapping documents to plain objects | Know that HTTP exists |

The practical payoff: the AI provider can be swapped in `ai.service.ts` alone; Mongo can be swapped
in the two repositories alone; and "does this endpoint leak another user's data?" is answerable by
reading one repository file, because that is the only place a query is built.

Every response — success or failure — uses the same envelope:

```json
{ "success": true,  "data": { "…": "…" } }
{ "success": false, "error": "Conversation not found" }
```

### Project structure

```
.
├── docker-compose.yml          # mongo + server + client, health-gated
├── .env.example                # every variable, safe placeholders
├── server/
│   ├── Dockerfile
│   └── src/
│       ├── server.ts           # connect db, then listen
│       ├── app.ts              # express wiring + error handler
│       ├── config.ts           # frozen config object + model catalog
│       ├── db/index.ts         # mongoose connect / disconnect
│       ├── db/models.ts        # User, Conversation and Message schemas
│       ├── middleware/auth.ts  # requireAuth → req.userId
│       ├── routers/            # auth.router.ts, chat.router.ts
│       ├── controllers/        # auth.controller.ts, chat.controller.ts
│       ├── services/           # auth.service.ts, chat.service.ts, ai.service.ts
│       ├── repositories/       # user.repository.ts, conversation.repository.ts
│       └── types/index.ts
└── client/
    ├── Dockerfile              # multi-stage: vite build → nginx
    ├── nginx.conf              # :8080, SPA fallback, /auth + /chat proxy
    └── src/
        ├── App.tsx             # routes: /auth, /
        ├── api/client.ts       # one request() helper, credentials: 'include'
        ├── context/AuthContext.tsx
        ├── components/         # Layout, ConversationList, MessageList, Composer, ModelPicker
        └── pages/              # AuthPage, ChatPage
```

### Data model

| Collection | Shape | Index |
|---|---|---|
| `users` | `{ _id, email, passwordHash, createdAt }` | unique on `email` (lowercased on write) |
| `conversations` | `{ _id, userId, title, model, createdAt, updatedAt }` | `{ userId: 1, updatedAt: -1 }` |
| `messages` | `{ _id, conversationId, userId, role, content, model?, createdAt }` | `{ conversationId: 1, createdAt: 1 }` |

Indexes are created at startup by `connectDb()`, so a fresh database (or a fresh `mongo_data`
volume) is correct on first boot with no migration step.

---

## API

Base URL `http://localhost:4000` in local development, or same-origin through nginx on
`http://localhost:8080` under docker. Auth is the httpOnly `token` cookie — there is no
`Authorization` header to manage in the client.

| Method | Path | Auth | Body / params | Success response |
|---|---|---|---|---|
| `POST` | `/auth/signup` | — | `{ email, password }` | `201 { success, data: { user } }` + sets `token` cookie |
| `POST` | `/auth/login` | — | `{ email, password }` | `200 { success, data: { user } }` + sets `token` cookie |
| `POST` | `/auth/logout` | — | — | `200 { success, data: { message } }`, clears the cookie |
| `GET` | `/auth/me` | cookie | — | `200 { success, data: { user } }` |
| `GET` | `/chat/models` | — | — | `200 { success, data: { models, defaultModel } }` |
| `POST` | `/chat/send` | cookie | `{ message, conversationId?, model? }` | `200 { success, data: { conversationId, title, reply } }` |
| `GET` | `/chat/history` | cookie | — | `200 { success, data: { conversations } }` |
| `GET` | `/chat/history/:conversationId` | cookie | path param | `200 { success, data: { conversation, messages } }` |
| `GET` | `/health` | — | — | `200 { status: 'ok', timestamp }` |

`user` is always `{ id, email, createdAt }`. The password hash has no path to the client.

| Status | Meaning |
|---|---|
| `400` | zod rejected the body — bad email, short password, or a `model` outside the catalog |
| `401` | missing, expired or invalid cookie, or wrong email/password on login |
| `404` | conversation id is malformed, or belongs to a different user (deliberately identical) |
| `409` | email already registered |
| `429` | rate limit tripped |
| `502` | the model provider failed — `"The assistant is unavailable right now. Please try again."` |

### Try it with curl

```bash
# sign up and keep the session cookie in a jar
curl -s -c jar.txt -X POST http://localhost:4000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"hunter2hunter2"}'

# list the model catalog
curl -s http://localhost:4000/chat/models

# send a message on a specific model
curl -s -b jar.txt -X POST http://localhost:4000/chat/send \
  -H 'Content-Type: application/json' \
  -d '{"message":"My order has not shipped yet.","model":"qwen.qwen3-32b"}'

# list conversations, then open one
curl -s -b jar.txt http://localhost:4000/chat/history
curl -s -b jar.txt http://localhost:4000/chat/history/<conversationId>
```

---

## AI integration and the model selector

The server talks to an **OpenAI-compatible Bedrock gateway** with a bearer key — a single
`POST ${BEDROCK_BASE_URL}/chat/completions` using the global `fetch` in Node 20. No AWS SDK, no
SigV4 signing, no provider SDK in `package.json`.

Each request carries a concise customer-support system prompt (friendly, plain text, asks a
clarifying question when the request is vague, answers under ~120 words) plus **the last 10
messages** of the conversation and the new one. That cap keeps token cost and latency flat as a
thread grows.

The sidebar exposes a model picker, grouped by vendor, that switches models between turns without
losing the thread. The catalog lives in `server/src/config.ts` and is served by `/chat/models`, so
the client never hardcodes a model id:

| Model id | Label | Vendor | Notes |
|---|---|---|---|
| `qwen.qwen3-32b` | Qwen3 32B | Qwen | Fast all-round — **default** |
| `qwen.qwen3-next-80b-a3b-instruct` | Qwen3 Next 80B | Qwen | Sparse MoE, quick and sharper |
| `qwen.qwen3-235b-a22b-2507` | Qwen3 235B | Qwen | Largest Qwen, best reasoning |
| `google.gemma-3-4b-it` | Gemma 3 4B | Google | Tiny and cheapest |
| `google.gemma-3-12b-it` | Gemma 3 12B | Google | Balanced small model |
| `google.gemma-3-27b-it` | Gemma 3 27B | Google | Strongest Gemma |
| `deepseek.v3.1` | DeepSeek V3.1 | DeepSeek | Strong general chat |
| `deepseek.v3.2` | DeepSeek V3.2 | DeepSeek | Newest DeepSeek |

The catalog is an **allow-list**, not a suggestion: a `model` that is not in it is rejected by zod
with `400` and never reaches the provider. If the provider call fails, the user's message is still
saved, no assistant message is persisted, and the API returns `502` — so a retry resumes cleanly
instead of leaving a half-written turn in the history.

---

## Running it locally (primary path)

Prerequisites: **Node 20+** and a **local `mongod` on `127.0.0.1:27017`** (already running on this
machine — no Atlas account and no Docker needed).

**1. Backend**

```bash
cd server
npm install
cp .env.example .env      # then fill in BEDROCK_API_KEY and JWT_SECRET
npm run dev               # tsx watch → http://localhost:4000
```

`server/.env` for local development:

```bash
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=virallens
JWT_SECRET=paste-the-output-of-openssl-rand-hex-32
CORS_ORIGIN=http://localhost:5173
BEDROCK_BASE_URL=https://your-gateway.example.com/v1
BEDROCK_API_KEY=your-key
NODE_ENV=development
```

**2. Frontend** — in a second terminal:

```bash
cd client
npm install
npm run dev               # → http://localhost:5173
```

Vite proxies `/auth` and `/chat` to `http://localhost:4000`, so the browser sees one origin and the
session cookie is sent without any CORS configuration. Open **http://localhost:5173**, sign up, chat.

**3. Check it's alive**

```bash
curl http://localhost:4000/health          # {"status":"ok","timestamp":"…"}
mongosh virallens --eval 'db.users.countDocuments()'
```

> Note: `dotenv` reads the `.env` next to the process's working directory, so **`server/.env` is the
> file that matters for local development**. The root `.env` is read by docker compose only.

## Running it with Docker (alternative)

```bash
cp .env.example .env      # fill in BEDROCK_API_KEY and JWT_SECRET
docker compose up --build
```

Then open **http://localhost:8080**. Nothing else to configure.

| Service | Image / build | Port | Waits for |
|---|---|---|---|
| `mongo` | `mongo:7`, named volume `mongo_data` | not published | — |
| `server` | `./server` (node:20-alpine, `npm run build` → `npm start`) | `4000` (bound to `127.0.0.1`) | `mongo` healthy |
| `client` | `./client` (vite build → `nginx:alpine`) | `8080` | `server` healthy |

Startup is health-gated end to end: the server only starts once Mongo answers
`db.adminCommand('ping')`, and nginx only starts once `/health` returns `200` — so the first page
load never races the API. Inside the compose network the server reaches Mongo at
`mongodb://mongo:27017`, and nginx proxies `/auth` and `/chat` to `server:4000` while serving the
SPA with `try_files $uri $uri/ /index.html` (with an exact-match `location = /auth` so the login
route itself is served by the SPA instead of the API).

Mongo's port is deliberately **not** published, so the container cannot collide with a `mongod`
already listening on `27017` on the host. To inspect it:

```bash
docker compose exec mongo mongosh virallens
docker compose logs -f server
docker compose down -v          # also drops the mongo_data volume
```

---

## Environment variables

Copy `.env.example` to `.env` (root, for docker) or `server/.env` (for local dev). **`.env` is
gitignored and no real key belongs in `.env.example`.**

| Variable | Default | Description |
|---|---|---|
| `BEDROCK_BASE_URL` | — | OpenAI-compatible gateway base URL. Already ends in `/v1`; the code does not append another. |
| `BEDROCK_API_KEY` | — | Bearer key for that gateway. **Required** — the server refuses to start without it. |
| `BEDROCK_MODEL` | `qwen.qwen3-32b` | Model used when the client sends no `model`. |
| `JWT_SECRET` | — | HS256 signing secret. **Required.** Generate with `openssl rand -hex 32`; rotating it invalidates every session. |
| `MONGO_URI` | `mongodb://127.0.0.1:27017` | Connection string. Compose overrides it to `mongodb://mongo:27017`. |
| `MONGO_DB` | `virallens` | Database name. |
| `PORT` | `4000` | Express listen port. |
| `CORS_ORIGIN` | `http://localhost:5173` | Origin allowed to send credentialed requests. |
| `NODE_ENV` | `development` | `production` sets the cookie to `secure` + `sameSite=none`; see the trade-off note below. |

The client reads one optional variable, `VITE_API_BASE`. Leave it empty in both local dev and
docker — the Vite proxy and nginx already make the API same-origin. Set it only when the frontend
is deployed to a different host than the API.

---

## Security notes

- **Passwords** are hashed with `bcryptjs` at 10 salt rounds. The hash is read inside
  `user.repository.ts` and compared inside `auth.service.ts`; no layer above ever holds it, and the
  `user` object serialised to the client is `{ id, email, createdAt }`.
- **Sessions are httpOnly cookies**, not `localStorage`. The JWT is unreadable from JavaScript, so an
  XSS bug cannot exfiltrate a session. Flags: `httpOnly`, `path=/`, 7-day `maxAge`, and
  `sameSite=lax` / `secure=false` in development, `sameSite=none` / `secure=true` in production.
- **Login failures are indistinguishable.** Unknown email and wrong password both return the same
  `401`, and the unknown-email path still runs a bcrypt comparison against a fixed dummy hash, so the
  two also take the same time — the endpoint is not a user-enumeration oracle.
- **Every read is user-scoped.** Repository queries always carry `userId`, and a conversation that
  belongs to someone else returns the same `404` as one that does not exist — no ownership leak.
  Malformed `ObjectId`s are caught and answered with `404` rather than a 500.
- **Rate limiting** with `express-rate-limit`: 20 requests / 15 min on `/auth` (blunts credential
  stuffing) and 30 / min on `/chat/send` (caps the spend a single account can trigger). The `/auth`
  bucket is keyed on the TCP peer address and the `/chat/send` bucket on the authenticated user id,
  never on a client-supplied `X-Forwarded-For`, so neither cap can be rotated away or aimed at
  someone else. The API port is published on `127.0.0.1` only, so nginx stays the single ingress.
- **The model is an allow-list.** Only the eight catalogued ids reach the provider; anything else is
  a `400` at the controller. Combined with `max_tokens: 800`, a hostile client cannot select an
  expensive model or an unbounded response.
- **Input validation** is `zod.safeParse` at every controller — nothing untyped travels inward.
- **CORS** is a single configured origin with `credentials: true`, never a wildcard.
- **Secrets** live only in `.env`, which is gitignored; `.env.example` carries placeholders. The
  server throws a clear startup error if `JWT_SECRET` or `BEDROCK_API_KEY` is missing, rather than
  booting into an insecure default.

---

## Notes and trade-offs

- **Mongoose over the raw driver.** Schemas in `db/models.ts` document the shape of every document
  in one place and give the database its own layer of validation underneath the zod checks at the
  controller. Indexes are declared next to the fields they cover rather than in connection code.
  Reads use `.lean()` so repositories still return plain objects, which keeps the layers above
  unaware of the ODM.
- **`NODE_ENV=development` is the compose default, on purpose.** Browsers drop `Secure` cookies over
  plain HTTP, so setting `production` while serving `http://localhost:8080` would silently break
  login. Flip it to `production` when the app sits behind TLS.
- **Replies are not streamed.** The model returns the whole answer, and the typing indicator covers
  the wait. Streaming would feel better on the long models, but SSE plus partial-message persistence
  was more surface area than this scope justified.
- **Context is capped at the last 10 messages.** Latency and token cost stay flat as a thread grows;
  the trade is that a very long conversation loses its earliest details.
- **Conversation titles are derived from the first user message.** Cheap and predictable; a
  model-generated title would read better but doubles the calls per new conversation.
- **The model picker applies to the next turn, not retroactively.** Each message stores the model
  that produced it, so a thread can legitimately mix models — useful for comparing them side by side.
- **No test files in the repo.** The app is verified end to end by driving the real UI with
  Playwright against a real Mongo, which for a surface this small caught more than unit tests would
  have. A longer-lived version would add supertest coverage on the controllers.
- **Rate limits are in-process.** Fine for one container; a multi-replica deployment would need a
  shared store (Redis) so the limit is global rather than per-instance.
