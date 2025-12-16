// db.js
const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI; // stored in .env
const client = new MongoClient(uri);

let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("studyPlanner"); // your database name
  }
  return db;
}

module.exports = connectDB;
