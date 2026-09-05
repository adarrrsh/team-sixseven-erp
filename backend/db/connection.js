const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "myDatabase";

const cache = (globalThis.__originMongo ??= { conn: null, promise: null });

mongoose.connection.on("connected", () => {
  console.log(`Connected successfully to the database "${dbName}"`);
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
  cache.conn = null;
  cache.promise = null;
});

async function connectDB() {
  if (cache.conn && mongoose.connection.readyState === 1) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(URI, {
        dbName,
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
        bufferCommands: false,
      })
      .then((m) => m.connection);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

async function disconnectDB() {
  await mongoose.connection.close();
  cache.conn = null;
  cache.promise = null;
  console.log("MongoDB connection closed");
}

if (require.main === module || process.env.NODE_ENV === "development") {
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, async () => {
      await disconnectDB();
      process.exit(0);
    });
  }
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
