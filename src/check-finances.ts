import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import User from '@/models/User';

async function main() {
  console.log("Loading environment variables...");
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error(".env.local not found");
    return;
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars: Record<string, string> = {};
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

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);

  try {
    const user = await User.findById('692f1a79b4a8b5bcddd6c321');
    console.log("User details for Suman:", JSON.stringify(user));
  } catch (error) {
    console.error("Error fetching user:", error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
