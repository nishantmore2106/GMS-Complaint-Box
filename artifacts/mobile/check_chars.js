const fs = require('fs');

const content = fs.readFileSync('d:/GMS-Complaint-Box/GMS-Complaint-Box/artifacts/mobile/context/AppContext.tsx', 'utf-8');

for (let i = 0; i < content.length; i++) {
  const code = content.charCodeAt(i);
  if (code > 127) {
    const lines = content.slice(0, i).split('\n');
    console.log(`Non-ASCII character found: ${content[i]} (code: ${code}) at line ${lines.length}, column ${lines[lines.length-1].length + 1}`);
  }
}
console.log("Scan complete.");
