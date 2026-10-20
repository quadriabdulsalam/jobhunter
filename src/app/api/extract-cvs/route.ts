import { NextResponse } from 'next/server';
import path from 'path';
import { parseFilesInDirectory, parseFileBuffer, ExtractedCVText } from '@/lib/cv-parser';
import { mergeCVsIntoMasterProfile } from '@/lib/profile-merger';
import { saveMasterProfile, getMasterProfile } from '@/lib/storage';

export async function GET() {
  try {
    const cvDir = path.join(process.cwd(), 'cvs');
    const extracted = await parseFilesInDirectory(cvDir);

    if (extracted.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No CV files found in cvs/ directory. Upload files or place them in the cvs folder.'
      }, { status: 400 });
    }

    console.log(`Consolidating ${extracted.length} CVs into Master Profile...`);
    const masterProfile = await mergeCVsIntoMasterProfile(extracted);
    saveMasterProfile(masterProfile);

    return NextResponse.json({
      success: true,
      filesProcessed: extracted.map(e => e.filename),
      profile: masterProfile
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in extract-cvs API:', errorMsg);
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      // Check if user requested to process the local cvs/ directory
      return GET();
    }

    const extracted: ExtractedCVText[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await parseFileBuffer(buffer, file.name);
      extracted.push(parsed);
    }

    const masterProfile = await mergeCVsIntoMasterProfile(extracted);
    saveMasterProfile(masterProfile);

    return NextResponse.json({
      success: true,
      filesProcessed: extracted.map(e => e.filename),
      profile: masterProfile
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
