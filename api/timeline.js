const fs = require("fs");
const path = require("path");

module.exports = function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), "timeline.html");
    const html = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (error) {
    console.error("Timeline error:", error);
    res.status(500).send("No se pudo cargar la timeline.");
  }
};
