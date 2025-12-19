// db.js
require('dotenv').config(); // only needed locally, Vercel injects env automatically
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
if (!uri) {
  throw new Error("MONGO_URI environment variable not set");
}

let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
    db = client.db(process.env.DB_NAME || "studyPlanner"); // configurable
    console.log("✅ Connected to MongoDB");
  }
  return db;
}

module.exports = connectDB;
