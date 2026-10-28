import { NextResponse } from 'next/server';
import { getTailoredCV, deleteTailoredCV } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cv = await getTailoredCV(id);

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
  const deleted = await deleteTailoredCV(id);
  return NextResponse.json({
    success: deleted
  });
}
