# Server-Sent Events (SSE) + Redis Pub/Sub

A minimal Node.js demo that pushes real-time messages from the server to the browser using
**Server-Sent Events**, with **Redis Pub/Sub** as the message source.

## Demo

A screen recording of the demo is in [`demo.webm`](demo.webm).

<video src="demo.webm" controls width="640"></video>

## What is SSE?

Server-Sent Events is a browser standard for **one-way, server-to-client** streaming over plain HTTP.
The client opens a normal `GET` request, the server keeps it open and writes messages as they happen.

Key points:

- **One direction only.** The server pushes; the client cannot send data back over the same channel
  (use a regular HTTP request for that). If you need bidirectional traffic, use WebSockets.
- **Plain HTTP/1.1 or HTTP/2.** No protocol upgrade, no special proxy configuration, works with
  normal HTTP infrastructure, compression and auth.
- **Automatic reconnection.** The browser's `EventSource` reconnects on its own if the connection
  drops, and can resume using the `Last-Event-ID` header.
- **Text only.** The payload is UTF-8 text (JSON is the common choice); binary needs encoding.

### The wire format

The response must use the `text/event-stream` content type, and each message is a block of
`field: value` lines ended by a **blank line**:

```
data: hello world

data: {"user":"rafael","text":"hi"}

event: ping
data: 1

```

Common fields: `data`, `event` (custom event name, defaults to `message`), `id` (sets
`Last-Event-ID`) and `retry` (reconnection delay in ms).

### How it works here

```
publisher -> Redis channel "notification" -> GET /stream (SSE) -> browser EventSource
```

- `server.js` subscribes to the Redis channel `notification` and writes every received message to the
  open SSE response as `data: <message>\n\n`.
- `public/index.html` opens an `EventSource` against `/stream` and renders each incoming message.
- When the browser closes the tab, `req.on("close")` ends the response so the connection is released.

Relevant server code:

```js
res.header("content-type", "text/event-stream");
res.header("connection", "keep-alive");

await redis.subscribe("notification", (message) => {
  res.write(`data: ${message}\n\n`);
});
```

And the client:

```js
const eventSource = new EventSource('http://localhost:3000/stream');

eventSource.addEventListener("message", (event) => {
  document.getElementById('mensagens').innerHTML = event.data;
});
```

## Requirements

- Node.js 22+ (or Docker)
- A running Redis instance

## Running locally

1. Start Redis on port `6379`:

   ```bash
   docker run --rm -p 6379:6379 redis:7-alpine
   ```

2. Install dependencies and start the server:

   ```bash
   npm install
   npm start
   ```

3. Open <http://localhost:3000>.

## Running with Docker Compose

```bash
docker compose up --build
```

This starts Redis and the app together and exposes the app on <http://localhost:3000>.

> **Note:** `server.js` currently hardcodes `redis://localhost:6379`, so it ignores the `REDIS_URL`
> variable set in `docker-compose.yml`. To make the Compose setup work, read the variable in
> `server.js`, e.g. `const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';`.

## Sending a message

With the page open, publish to the `notification` channel and the text shows up in the browser
instantly:

```bash
# local Redis
redis-cli PUBLISH notification "Hello from Redis!"

# Redis running in Docker Compose
docker exec -it sse-redis redis-cli PUBLISH notification "Hello from Redis!"
```

## Project structure

```
.
├── server.js            # Express server, Redis subscriber and the /stream SSE endpoint
├── public/index.html    # Browser client using EventSource
├── Dockerfile
├── docker-compose.yml
└── demo.webm            # Screen recording of the demo
```

## Notes and limitations

- Browsers limit the number of concurrent `EventSource` connections per domain over HTTP/1.1
  (about 6). HTTP/2 raises that limit considerably.
- Some proxies buffer responses; if messages arrive in bursts, disable buffering
  (e.g. `X-Accel-Buffering: no` for nginx).
- Send a periodic comment line (`: keep-alive\n\n`) if idle connections are being dropped.

## Credits

The core implementation is based on this video:
<https://www.youtube.com/watch?v=uiT4oK19hu4&list=PLNHxHgB-_LTusKqdWaZJtRbcqEMXPZXtw&index=3>

---

**AI disclosure:** the AI wrote this `README.md`, the `Dockerfile`, `docker-compose.yml`,
`.gitignore`, `package.json` / `package-lock.json`, and organized the folder structure.
The application code itself (`server.js` and `public/index.html`) was written by a human,
following [this video](https://www.youtube.com/watch?v=uiT4oK19hu4&list=PLNHxHgB-_LTusKqdWaZJtRbcqEMXPZXtw&index=3)
as a reference.
