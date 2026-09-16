const path = require('path');
const express = require('express');
const { createClient } = require('redis');
const app = express();
const port = 3000;
const redisUrl = 'redis://localhost:6379';

//Redis singleton: one shared connection for the whole app
const redis = createClient({ url: redisUrl });
redis.on('error', (err) => {console.error(err)});
redis.connect().then((client) => {console.info(client.toString())})

app.use(express.static(path.join(__dirname, 'public')));

app.get('/stream', async (req, res) => {
  //SSE requires these headers.
  res.header("content-type", "text/event-stream");
  res.header("connection", "keep-alive");

  // The 'data: ' prefix must already be in the message published to Redis
  await redis.subscribe("notification", (message) => {
    res.write(`data: ${message}\n\n`);
  });

  //If the user closes the window, the connection must be closed too
  req.on("close", () => {
    res.end();
  });
});

app.listen(port, () => console.log(`http://localhost:${port}`));
