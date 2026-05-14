import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 });

  // Validate file type and size (max 5MB)
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'invalid file type' }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: 'file too large (max 4MB)' }, { status: 400 });
  }

  const blob = await put(`uploads/${user.id}/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });

  return NextResponse.json({ url: blob.url });
}
