import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/appwrite-server';
import { ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

const BUCKET_CONFIG: Record<string, { maxSize: number; allowedTypes: string[] }> = {
  cvs: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  avatars: {
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
  logos: {
    maxSize: 2 * 1024 * 1024,
    allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
  },
  documents: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  },
  portfolio: {
    maxSize: 25 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/zip',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  }
};

export async function POST(request: NextRequest) {
  const sessionCookie =
    request.cookies.get('a_session_' + (process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')) ??
    request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const { storage } = createAdminClient();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string | null) ?? 'cvs';

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil skickad.' }, { status: 400 });
    }

    const config = BUCKET_CONFIG[bucket];
    if (!config) {
      return NextResponse.json({ error: 'Ogiltig bucket.' }, { status: 400 });
    }

    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Filtypen stöds inte.' }, { status: 400 });
    }

    if (file.size > config.maxSize) {
      const maxMB = Math.round(config.maxSize / (1024 * 1024));
      return NextResponse.json({ error: `Filen är för stor. Max ${maxMB} MB.` }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await storage.createFile(
      bucket,
      ID.unique(),
      InputFile.fromBuffer(buffer, file.name)
    );

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '';

    return NextResponse.json({
      success: true,
      fileId: uploaded.$id,
      fileName: file.name,
      url: `${endpoint}/storage/buckets/${bucket}/files/${uploaded.$id}/view?project=${projectId}`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Uppladdning misslyckades.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
