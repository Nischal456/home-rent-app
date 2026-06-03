const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function main() {
  console.log("Loading environment variables...");
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found");
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
  await mongoose.connect(uri);

  try {
    const localDb = mongoose.connection.useDb('local');
    const oplog = localDb.collection('oplog.rs');

    console.log("Querying recent oplog records...");
    // Let's fetch the last 2000 oplog records and filter them in JavaScript
    const ops = await oplog.find({}).sort({ $natural: -1 }).limit(2000).toArray();
    console.log(`Fetched ${ops.length} recent oplog records.`);

    const filteredOps = ops.filter(op => {
      const ns = op.ns || '';
      const opStr = JSON.stringify(op).toLowerCase();
      // Look for water, tanker, pani, or delete/drop commands
      return ns.includes('watertanker') || 
             ns.includes('water') || 
             ns.includes('tanker') || 
             (op.op === 'c' && op.o && (op.o.drop || op.o.dropDatabase)) ||
             (op.op === 'd' && (opStr.includes('water') || opStr.includes('tanker') || opStr.includes('pani')));
    });

    console.log(`\n=== Found ${filteredOps.length} matching operations in recent oplog ===`);
    filteredOps.forEach(op => {
      console.log(`Op: ${op.op}, NS: ${op.ns}, TS: ${op.ts}`);
      console.log("Details:", JSON.stringify(op.o, null, 2));
      console.log("---");
    });

  } catch (error) {
    console.error("Error reading oplog:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
