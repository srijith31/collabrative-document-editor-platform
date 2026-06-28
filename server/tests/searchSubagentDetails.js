import fs from 'fs';
const file = '/Users/srijithsharma/.gemini/antigravity-ide/brain/529760f5-a2ea-4b6f-b277-0071feab0cbb/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(file, 'utf8').split('\n');
for (const line of lines) {
  if (!line) continue;
  const obj = JSON.parse(line);
  if (obj.step_index === 126 || (obj.tool_calls && JSON.stringify(obj.tool_calls).includes('browser_subagent'))) {
    console.log('Found line, content length:', obj.content ? obj.content.length : 'no content');
    // Let's print out lines around "Step 81" in obj.content
    if (obj.content && obj.content.includes('Step 81')) {
      const idx = obj.content.indexOf('Step 81');
      console.log('Step 81 slice:', obj.content.substring(idx - 100, idx + 1000));
    }
    // Let's also print lines around "Step 26"
    if (obj.content && obj.content.includes('Step 26')) {
      const idx = obj.content.indexOf('Step 26');
      console.log('Step 26 slice:', obj.content.substring(idx - 100, idx + 1000));
    }
  }
}
