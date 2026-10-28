import { NextResponse } from 'next/server';
import { parseFileBuffer } from '@/lib/cv-parser';
import { mergeCVsIntoMasterProfile } from '@/lib/profile-merger';
import { isAIConfigured } from '@/lib/openai-config';

const allowedExtensions = new Set(['.pdf', '.docx', '.txt']);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files').filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'Choose a PDF, DOCX, or TXT CV to import.' }, { status: 400 });
    }

    const extracted = [];
    for (const file of files) {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.has(extension)) {
        return NextResponse.json({ success: false, error: `${file.name} is not supported. Choose a PDF, DOCX, or TXT file.` }, { status: 400 });
      }
      extracted.push(await parseFileBuffer(Buffer.from(await file.arrayBuffer()), file.name));
    }

    const profile = await mergeCVsIntoMasterProfile(extracted);
    return NextResponse.json({
      success: true,
      filesProcessed: extracted.map(file => file.filename),
      usedAI: isAIConfigured(),
      profile
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
