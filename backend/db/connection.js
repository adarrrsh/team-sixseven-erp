const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB || "myDatabase";

/**
 * One connection per process, reused across requests.
 *
 * On a serverless platform the module is re-evaluated on every cold start but
 * the container is reused between invocations, so the live connection is parked
 * on `globalThis`. Without this each request would open its own pool and
 * exhaust the Atlas connection limit.
 */
const cache = (globalThis.__originMongo ??= { conn: null, promise: null });

mongoose.connection.on("connected", () => {
  console.log(`Connected successfully to the database "${dbName}"`);
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
  // Drop the cache so the next request dials again rather than reusing a corpse.
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
        // A serverless container handles one request at a time; a big pool is
        // wasted sockets against the Atlas limit.
        maxPoolSize: 10,
        // Fail immediately when there is no connection instead of queueing the
        // operation for ten seconds and then timing out with a misleading error.
        bufferCommands: false,
      })
      .then((m) => m.connection);
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Let the next request retry rather than caching a rejected promise for
    // the life of the container.
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

/**
 * Only a long-running process should tear the connection down on a signal.
 * A serverless container is frozen and thawed between invocations, and closing
 * the connection there would discard a pool the next request wants.
 */
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
