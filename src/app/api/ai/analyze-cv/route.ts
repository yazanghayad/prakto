import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, AI_MODEL_CREATIVE } from '@/lib/openai';
import { createAdminClient } from '@/lib/appwrite-server';
// Import from lib directly to bypass pdf-parse's index.js test-file loading bug
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;

// ─── Types ────────────────────────────────────────────────────

export interface CVAnalysisResult {
  skills: string[];
  bio: string;
  linkedinUrl: string;
  phone: string;
  email: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function extractJSON(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const braces = text.match(/\{[\s\S]*\}/);
  if (braces) return braces[0];
  return text;
}

// ─── POST handler ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const sessionCookie =
    request.cookies.get('a_session_' + (process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '')) ??
    request.cookies.get('appwrite_session');

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileId } = body as { fileId?: string };

    if (!fileId) {
      return NextResponse.json({ error: 'fileId krävs.' }, { status: 400 });
    }

    // 1. Download the CV from Appwrite storage
    const { storage } = createAdminClient();
    const fileBuffer = await storage.getFileDownload('cvs', fileId);

    // 2. Extract text using pdf-parse
    const pdfBuffer = Buffer.isBuffer(fileBuffer)
      ? fileBuffer
      : Buffer.from(fileBuffer as ArrayBuffer);

    const pdfData = await pdfParse(pdfBuffer);
    const cvText = (pdfData.text || '').trim().slice(0, 8000);

    if (!cvText || cvText.length < 20) {
      return NextResponse.json({ error: 'Kunde inte läsa text från CV-filen.' }, { status: 422 });
    }

    // 2. Send to AI for analysis
    const openai = getOpenAIClient();
    const res = await openai.chat.completions.create({
      model: AI_MODEL_CREATIVE,
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `Du är en CV-analysexpert. Analysera följande CV-text och extrahera strukturerad information.

Returnera ENBART giltig JSON med exakt denna struktur:
{
  "skills": ["skill1", "skill2", ...],
  "bio": "<en helt nyskriven, personlig och engagerande beskrivning>",
  "linkedinUrl": "<LinkedIn-URL om den finns, annars tom sträng>",
  "phone": "<telefonnummer om det finns, annars tom sträng>",
  "email": "<e-postadress om den finns, annars tom sträng>"
}

Regler för skills:
- Extrahera ALLA kompetenser: tekniska, mjuka, verktyg, certifieringar, språk, branschkunskaper
- Inkludera även implicita kompetenser (t.ex. om personen jobbat som elevassistent → "pedagogik", "samarbete", "barn & ungdom")
- Returnera max 20 skills, minst 5

Regler för bio:
- Skriv en HELT NY kort beskrivning på svenska, i jag-form, 2-3 meningar
- KOPIERA INTE text från CVt — skriv om med egna ord
- Basera bio:n på de extraherade kompetenserna och erfarenheterna
- Tonen ska vara professionell men personlig, som en kort "om mig"-text för en praktikprofil
- Max 250 tecken

Övriga regler:
- Om du inte hittar viss information, returnera tom sträng eller tom array
- Svara ENBART med JSON, ingen annan text`
        },
        {
          role: 'user',
          content: `CV-text:\n\n${cvText}`
        }
      ]
    });

    const content = res.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(extractJSON(content)) as CVAnalysisResult;

    // Sanitize
    const result: CVAnalysisResult = {
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.filter((s) => typeof s === 'string').slice(0, 20)
        : [],
      bio: typeof parsed.bio === 'string' ? parsed.bio.slice(0, 500) : '',
      linkedinUrl: typeof parsed.linkedinUrl === 'string' ? parsed.linkedinUrl : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      email: typeof parsed.email === 'string' ? parsed.email : ''
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kunde inte analysera CV.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
