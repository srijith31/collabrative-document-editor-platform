import fs from 'fs';
import path from 'path';
import { parsePdfToTemplateData } from '../services/pdfParserService.js';

const pdfPath = '/Users/srijithsharma/Desktop/projects/Collaborative Document Editor/client/src/24885A0549.PDF';

async function test() {
  console.log('Reading PDF file...');
  const fileBuffer = fs.readFileSync(pdfPath);
  
  console.log('Parsing PDF...');
  try {
    const result = await parsePdfToTemplateData(fileBuffer);
    console.log('\n--- COVER PAGE METADATA ---');
    console.log(JSON.stringify(result.coverPage, null, 2));
    
    console.log('\n--- SECTIONS FOUND ---');
    console.log(`Total sections: ${result.sections.length}`);
    result.sections.forEach((sec, index) => {
      console.log(`\nSection ${index + 1}: [${sec.title}] (Page: ${sec.pageNumber})`);
      console.log(`Content length: ${sec.content.length} chars`);
      console.log(`Snippet: ${sec.content.substring(0, 150)}...`);
    });
  } catch (err) {
    console.error('Error during parsing:', err);
  }
}

test();
