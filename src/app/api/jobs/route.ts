import { NextResponse } from 'next/server';
import { getAllJobs, upsertJob, deleteJob, getMasterProfile, saveTailoredCV } from '@/lib/storage';
import { JobPosting } from '@/lib/types';
import { tailorCVForJob } from '@/lib/cv-tailorer';

export async function GET() {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json({
      success: true,
      jobs
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Job id is required' }, { status: 400 });
    }

    const deleted = await deleteJob(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const jobId = data.id || `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const job: JobPosting = {
      id: jobId,
      title: data.title || 'Untitled Job',
      company: data.company || 'Unknown Company',
      location: data.location || 'Remote',
      workplaceType: data.workplaceType || 'Unknown',
      url: data.url || '',
      source: data.source || 'linkedin',
      applyType: data.applyType || 'unknown',
      externalApplyUrl: data.externalApplyUrl || data.url || '',
      description: data.description || '',
      extractedAt: new Date().toISOString(),
      status: 'extracted'
    };

    const savedJob = await upsertJob(job);

    // If autoTailor requested and profile exists, generate tailored CV immediately
    let tailoredCv = null;
    if (data.autoTailor) {
      const profile = await getMasterProfile();
      if (profile && savedJob.description) {
        tailoredCv = await tailorCVForJob(profile, savedJob);
        await saveTailoredCV(tailoredCv);
        savedJob.tailoredCvId = tailoredCv.id;
        savedJob.status = 'tailored';
        savedJob.matchScore = tailoredCv.matchScore;
        await upsertJob(savedJob);
      }
    }

    return NextResponse.json({
      success: true,
      job: savedJob,
      tailoredCv
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
