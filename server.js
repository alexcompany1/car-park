const http = require("http");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health") {
    res.statusCode = 200;
    return res.end(JSON.stringify({ status: "ok" }));
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ service: "car-park", status: "ok" }));
});

server.listen(port, () => {
  console.log(`car-park listening on port ${port}`);
});

module.exports = server;
