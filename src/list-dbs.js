const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function main() {
  console.log("Loading environment variables...");
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found at path:", envPath);
    return;
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const parts = trimmed.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      envVars[key] = val;
    }
  });

  const uri = envVars['MONGODB_URI'];
  if (!uri) {
    console.error("MONGODB_URI not found");
    return;
  }

  await mongoose.connect(uri);

  try {
    const admin = mongoose.connection.db.admin();
    const dbsList = await admin.listDatabases();
    console.log("\n=== DATABASES ===");
    for (const dbInfo of dbsList.databases) {
      console.log(`- Database: ${dbInfo.name} (Size: ${dbInfo.sizeOnDisk} bytes)`);
      if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
      
      const currentDb = mongoose.connection.useDb(dbInfo.name);
      const collections = await currentDb.db.listCollections().toArray();
      for (const col of collections) {
        const count = await currentDb.collection(col.name).countDocuments();
        console.log(`   * Collection: ${col.name}, Count: ${count}`);
      }
    }
  } catch (error) {
    console.error("Error listing databases/collections:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
