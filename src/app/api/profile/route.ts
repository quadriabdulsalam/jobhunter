import { NextResponse } from 'next/server';
import { getMasterProfile, saveMasterProfile } from '@/lib/storage';
import { MasterProfile } from '@/lib/types';

export async function GET() {
  const profile = getMasterProfile();
  if (!profile) {
    return NextResponse.json({
      success: false,
      message: 'Master profile not generated yet.'
    }, { status: 404 });
  }
  return NextResponse.json({
    success: true,
    profile
  });
}

export async function POST(req: Request) {
  try {
    const updated = await req.json() as MasterProfile;
    updated.metadata = {
      ...updated.metadata,
      lastUpdated: new Date().toISOString()
    };
    saveMasterProfile(updated);
    return NextResponse.json({
      success: true,
      profile: updated
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      success: false,
      error: errorMsg
    }, { status: 500 });
  }
}
