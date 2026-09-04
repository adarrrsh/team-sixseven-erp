const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "myDatabase";

mongoose.connection.on("connected", () => {
  console.log(`Connected successfully to the database "${dbName}"`);
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

async function connectDB() {
  try {
    await mongoose.connect(URI, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    });
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await disconnectDB();
    process.exit(0);
  });
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
