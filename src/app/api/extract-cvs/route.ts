import { NextResponse } from 'next/server';
import { parseFileBuffer, ExtractedCVText } from '@/lib/cv-parser';
import { mergeCVsIntoMasterProfile } from '@/lib/profile-merger';
import { saveMasterProfile } from '@/lib/storage';
import { getStorageContext } from '@/lib/supabase-server';

export async function GET() {
  return NextResponse.json({ success: false, error: 'Upload your CV files with POST.' }, { status: 405 });
}

export async function POST(req: Request) {
  try {
    const files = (await req.formData()).getAll('files').filter((file): file is File => file instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'Please select at least one CV file.' }, { status: 400 });
    }

    const context = await getStorageContext();
    const extracted: ExtractedCVText[] = [];
    for (const file of files) {
      extracted.push(await parseFileBuffer(Buffer.from(await file.arrayBuffer()), file.name));
    }
    const masterProfile = await mergeCVsIntoMasterProfile(extracted);
    await saveMasterProfile(context, masterProfile);

    return NextResponse.json({ success: true, filesProcessed: extracted.map(file => file.filename), profile: masterProfile });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
