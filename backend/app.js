const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connection");
const api = require("./routers");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Server is healthy" });
});

app.use("/api", api);

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  const status = err.status ?? (err.name === "ValidationError" ? 400 : 500);
  if (err.code === 11000) {
    return res.status(409).json({ error: "That record already exists", keys: err.keyValue });
  }
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || "Internal server error" });
});

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server initialized on port ${PORT}`);
    });
  });
}

module.exports = app;
