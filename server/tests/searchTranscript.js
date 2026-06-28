import fs from 'fs';
const file = '/Users/srijithsharma/.gemini/antigravity-ide/brain/529760f5-a2ea-4b6f-b277-0071feab0cbb/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(file, 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  if (line.includes('Check alerts') || line.includes('__alerts') || line.includes('Step 81')) {
    console.log(`Line ${i}:`, line.substring(0, 500));
  }
}
