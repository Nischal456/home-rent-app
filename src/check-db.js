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

  console.log("Connecting to MongoDB cluster...");
  // Parse URI to see the connection string details (masking password)
  const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
  console.log("URI details:", maskedUri);

  await mongoose.connect(uri);
  console.log("Connected successfully!");

  try {
    const admin = mongoose.connection.db.admin();
    
    // 1. List all databases
    const dbsList = await admin.listDatabases();
    console.log("\n=== Databases in Cluster ===");
    console.log(JSON.stringify(dbsList, null, 2));

    // For each database, list all collections
    for (const dbInfo of dbsList.databases) {
      const dbName = dbInfo.name;
      // Skip system databases
      if (['admin', 'local', 'config'].includes(dbName)) continue;
      
      console.log(`\n=== Collections in Database: ${dbName} ===`);
      const currentDb = mongoose.connection.useDb(dbName);
      const collections = await currentDb.db.listCollections().toArray();
      console.log(collections.map(c => c.name));

      for (const col of collections) {
        const colName = col.name;
        // Count documents
        const count = await currentDb.collection(colName).countDocuments();
        console.log(` - Collection: ${colName}, Count: ${count}`);

        // If it looks like it might contain water tanker logs (watertankers, expenses, logs, utilities, etc.),
        // let's print a sample or search for tanker/water terms.
        if (count > 0) {
          const sampleDocs = await currentDb.collection(colName).find({}).limit(5).toArray();
          console.log(`   Sample docs from ${colName}:`);
          console.log(JSON.stringify(sampleDocs, null, 2));

          // Also search for water/tanker keywords in all string fields
          const waterDocs = await currentDb.collection(colName).find({
            $or: [
              { vendor: /water|tanker|pani/i },
              { remarks: /water|tanker|pani/i },
              { description: /water|tanker|pani/i },
              { category: /water|tanker|pani/i }
            ]
          }).toArray();
          if (waterDocs.length > 0) {
            console.log(`   Found ${waterDocs.length} water/tanker documents in ${dbName}.${colName}:`);
            console.log(JSON.stringify(waterDocs, null, 2));
          }
        }
      }
    }

  } catch (error) {
    console.error("Error searching databases:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.");
  }
}

main().catch(console.error);
