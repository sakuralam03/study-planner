const uri = process.env.MONGO_URI;
let client;
let db;

async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(); // uses DB from URI
    console.log("✅ Connected to MongoDB:", db.databaseName);
  }
  return db;
}
