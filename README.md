# System Design

Study repository following the **System Design** playlist by **Renato Augusto**:
<https://www.youtube.com/watch?v=qj_kkF7FCO4&list=PLNHxHgB-_LTusKqdWaZJtRbcqEMXPZXtw>

Each directory holds a small, self-contained project for one topic of the playlist.

## Topics

### Server-Sent Events (SSE) — [`server_sent_events/`](server_sent_events)

SSE is a browser standard for **one-way, server-to-client** streaming over plain HTTP. The client
opens a normal `GET` request with `EventSource`, the server answers with `Content-Type:
text/event-stream` and keeps the connection open, writing messages as they happen:

```
data: hello world

```

It is simpler than WebSockets (no protocol upgrade, works with regular HTTP infrastructure) and the
browser reconnects automatically — but it is text-only and the client cannot send data back over the
same channel.

The demo in [`server_sent_events/`](server_sent_events) is a Node.js + Express server that streams
messages published to a **Redis Pub/Sub** channel straight to the browser. See its
[README](server_sent_events/README.md) for details and run instructions.
