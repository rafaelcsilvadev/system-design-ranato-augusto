const express = require('express');
const path = require('path');

const app = express();
const PORT = 3002;
const SERVER_NAME = 'Servidor B';

app.get('/', (req, res) => {
  res.setHeader('X-Served-By', SERVER_NAME);
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`${SERVER_NAME} rodando em http://localhost:${PORT}`);
});
