import { NextResponse } from 'next/server';
import { getMasterProfile, getJobById, saveTailoredCV } from '@/lib/storage';
import { tailorCVForJob } from '@/lib/cv-tailorer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile = await getMasterProfile();

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Master Profile has not been created yet. Please extract your CVs first.'
      }, { status: 400 });
    }

    let jobData: { id?: string; title: string; company: string; location?: string; description: string };

    if (body.jobId) {
      const storedJob = await getJobById(body.jobId);
      if (!storedJob) {
        return NextResponse.json({
          success: false,
          error: `Job with id ${body.jobId} not found.`
        }, { status: 404 });
      }
      jobData = storedJob;
    } else {
      jobData = {
        title: body.title || 'Target Role',
        company: body.company || 'Target Company',
        location: body.location || '',
        description: body.description || ''
      };
    }

    if (!jobData.description || jobData.description.trim().length < 20) {
      return NextResponse.json({
        success: false,
        error: 'Job description is too short or empty.'
      }, { status: 400 });
    }

    console.log(`Tailoring CV for ${jobData.title} at ${jobData.company}...`);
    const tailoredCv = await tailorCVForJob(profile, jobData);
    await saveTailoredCV(tailoredCv);

    return NextResponse.json({
      success: true,
      tailoredCv
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Tailor error:', errorMsg);
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
