const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log("=== .env.local ===");
  console.log(content);
} else {
  console.log(".env.local not found");
}
