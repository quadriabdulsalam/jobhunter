import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export interface ExtractedCVText {
  filename: string;
  format: 'pdf' | 'docx' | 'txt' | 'other';
  rawText: string;
}

export async function parseFileBuffer(buffer: Buffer, filename: string): Promise<ExtractedCVText> {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    const data = await pdfParse(buffer);
    return {
      filename,
      format: 'pdf',
      rawText: data.text.trim()
    };
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ buffer });
    return {
      filename,
      format: 'docx',
      rawText: result.value.trim()
    };
  } else {
    return {
      filename,
      format: 'txt',
      rawText: buffer.toString('utf-8').trim()
    };
  }
}

export async function parseFilesInDirectory(dirPath: string): Promise<ExtractedCVText[]> {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const files = fs.readdirSync(dirPath);
  const results: ExtractedCVText[] = [];

  for (const file of files) {
    if (file.startsWith('.')) continue; // skip hidden files
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    try {
      const buffer = fs.readFileSync(fullPath);
      const parsed = await parseFileBuffer(buffer, file);
      if (parsed.rawText.length > 50) {
        results.push(parsed);
      }
    } catch (err) {
      console.error(`Failed parsing file ${file}:`, err);
    }
  }

  return results;
}
