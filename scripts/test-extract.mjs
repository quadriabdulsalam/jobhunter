import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

async function testExtract() {
  const cvDir = path.join(process.cwd(), 'cvs');
  const files = fs.readdirSync(cvDir);
  console.log(`Found ${files.length} files in ${cvDir}`);

  for (const file of files) {
    const filePath = path.join(cvDir, file);
    console.log(`\n--- Reading: ${file} ---`);
    try {
      if (file.endsWith('.pdf')) {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        console.log(`Pages: ${data.numpages}, Text length: ${data.text.length}`);
        console.log(`Preview: ${data.text.slice(0, 200).replace(/\n+/g, ' ')}...`);
      } else if (file.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ path: filePath });
        console.log(`Text length: ${result.value.length}`);
        console.log(`Preview: ${result.value.slice(0, 200).replace(/\n+/g, ' ')}...`);
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }
}

testExtract();
