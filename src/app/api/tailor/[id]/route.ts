import { NextResponse } from 'next/server';
import { getTailoredCV, deleteTailoredCV } from '@/lib/storage';
import { getStorageContext } from '@/lib/supabase-server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cv = await getTailoredCV(await getStorageContext(), id);

  if (!cv) {
    return NextResponse.json({
      success: false,
      error: `Tailored CV ${id} not found.`
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    tailoredCv: cv
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = await deleteTailoredCV(await getStorageContext(), id);
  return NextResponse.json({
    success: deleted
  });
}
