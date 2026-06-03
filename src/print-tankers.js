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
    const db = mongoose.connection.useDb('test');
    
    console.log("\n=== ALL DOCUMENTS IN watertankers ===");
    const tankers = await db.collection('watertankers').find({}).toArray();
    console.log(JSON.stringify(tankers, null, 2));

    console.log("\n=== ALL DOCUMENTS IN expenses containing 'water', 'tanker', 'pani' or similar ===");
    const expenses = await db.collection('expenses').find({}).toArray();
    const waterExpenses = expenses.filter(e => {
      const desc = (e.description || '').toLowerCase();
      const cat = (e.category || '').toLowerCase();
      return desc.includes('water') || desc.includes('tanker') || desc.includes('pani') ||
             cat.includes('water') || cat.includes('tanker') || cat.includes('pani');
    });
    console.log(JSON.stringify(waterExpenses, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
