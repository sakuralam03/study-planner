// db.js
require('dotenv').config(); // only needed locally, Vercel injects env automatically
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI;
let client;
let db;

async function connectDB() {
  if (!client) {
    console.log("Connecting with URI:", uri);
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.DB_NAME || "studyPlanner"); // uses DB_NAME from env
    console.log("✅ Connected to MongoDB:", db.databaseName);
  }
  return db;
}

module.exports = connectDB;
