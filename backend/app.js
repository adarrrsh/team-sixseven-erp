const express = require("express");
const app = express();

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Server is healthy" });
});

app.listen(8000, () => {
  console.log("Server initialized");
});
