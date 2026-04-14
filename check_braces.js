
import fs from 'fs';
const content = fs.readFileSync('d:/GMS-Complaint-Box/GMS-Complaint-Box/artifacts/mobile/app/complaint/[id].tsx', 'utf8');

const stack = [];
const regex = /<(\/?[A-Za-z0-9.]+)|(\/>)/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const isSelfClosing = match[0] === '/>';

    if (isSelfClosing) {
        // self-closing doesn't push/pop if it's <Tag />, but the regex counts <Tag and /> separately
        // Actually, let's use a simpler logic
    }
}

// Simple counter logic for tags
const openings = (content.match(/<[A-Za-z0-9.]+/g) || []).length;
const closings = (content.match(/<\/[A-Za-z0-9.]+/g) || []).length;
const selfClosings = (content.match(/\/>/g) || []).length;
console.log({ openings, closings, selfClosings, net: openings - closings - selfClosings });

// Braces
let b = 0;
for (let c of content) { if(c === '{') b++; if(c === '}') b--; }
console.log({ netBraces: b });
