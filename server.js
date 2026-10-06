const http = require("http");
const fs = require("fs");
const path = require("path");

const port = process.env.PORT || 3000;
const timelinePath = path.join(__dirname, "timeline.html");

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 200;
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (req.url === "/" || req.url === "/timeline") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.statusCode = 200;
    return res.end(fs.readFileSync(timelinePath, "utf8"));
  }

  res.setHeader("Content-Type", "application/json");
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(port, () => {
  console.log(`car-park listening on port ${port}`);
});

module.exports = server;
