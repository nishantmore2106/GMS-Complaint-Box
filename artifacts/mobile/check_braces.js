const fs = require('fs');

const content = fs.readFileSync('d:/GMS-Complaint-Box/GMS-Complaint-Box/artifacts/mobile/context/AppContext.tsx', 'utf-8');

function checkBalance(str) {
  const stack = [];
  const map = {
    '(': ')',
    '[': ']',
    '{': '}'
  };

  const lines = str.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (map[char]) {
        stack.push({ char, line: i + 1, col: j + 1 });
      } else if (Object.values(map).includes(char)) {
        const last = stack.pop();
        if (!last || map[last.char] !== char) {
          console.log(`Mismatch: found ${char} at line ${i + 1}:${j + 1} but expected ${last ? map[last.char] : 'nothing'} (opened at line ${last ? last.line : 'N/A'}:${last ? last.col : 'N/A'})`);
          return false;
        }
      }
    }
  }

  if (stack.length > 0) {
    console.log(`Unclosed: ${stack.map(s => s.char).join(', ')} started at line ${stack[0].line}:${stack[0].col}`);
    return false;
  }

  console.log("Balanced!");
  return true;
}

checkBalance(content);
