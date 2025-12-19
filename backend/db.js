// db.js
require('dotenv').config(); // only needed locally, Vercel injects env automatically
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri); // no extra options needed
    await client.connect();
    db = client.db(process.env.DB_NAME || "studyPlanner");
    console.log("✅ Connected to MongoDB");
  }
  return db;
}

module.exports = connectDB;