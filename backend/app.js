const express = require("express");
const connectDB = require("./db/connection");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Server is healthy" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server initialized on port ${PORT}`);
  });
});

module.exports = app;
