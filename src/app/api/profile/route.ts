import { NextResponse } from 'next/server';
import { getMasterProfile, saveMasterProfile } from '@/lib/storage';
import { getStorageContext } from '@/lib/supabase-server';
import { MasterProfile } from '@/lib/types';

export async function GET() {
  try {
    const context = await getStorageContext();
    const profile = await getMasterProfile(context);
    if (!profile) {
      return NextResponse.json({
        success: false,
        message: 'Master profile not generated yet.'
      }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      profile
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getStorageContext();
    const updated = await req.json() as MasterProfile;
    updated.metadata = {
      ...updated.metadata,
      lastUpdated: new Date().toISOString()
    };
    await saveMasterProfile(context, updated);
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
