import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, AI_MODEL_REASONING, AI_MODEL_CREATIVE } from '@/lib/openai';
import type {
  AIRequest,
  MatchResult,
  CoverLetterResult,
  ProfileTipsResult,
  InterviewPrepResult,
  SkillGapResult,
  StudentContext,
  InternshipContext
} from '@/features/ai/api/types';

// ─── Prompt builders ──────────────────────────────────────────

function studentSummary(s: StudentContext): string {
  return [
    `Skola: ${s.school}`,
    `Program: ${s.program}`,
    `Utbildningsnivå: ${s.educationLevel}`,
    `Stad: ${s.city}`,
    `Kompetenser: ${s.skills.join(', ')}`,
    `Praktiktyp: ${s.internshipType.join(', ')}`,
    `Bio: ${s.bio}`
  ].join('\n');
}

function internshipSummary(i: InternshipContext): string {
  return [
    `Titel: ${i.title}`,
    `Beskrivning: ${i.description}`,
    `Krav: ${i.requirements}`,
    `Område: ${i.field}`,
    `Stad: ${i.city}`,
    `Typ: ${i.internshipType}`,
    i.workplaceType ? `Arbetsplats: ${i.workplaceType}` : '',
    i.duration ? `Längd: ${i.duration}` : '',
    i.preferredQualifications ? `Meriterande: ${i.preferredQualifications}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── JSON extraction helper ──────────────────────────────────

function extractJSON(text: string): string {
  // Try to find a JSON block in the response (```json ... ``` or raw { ... })
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const braces = text.match(/\{[\s\S]*\}/);
  if (braces) return braces[0];
  return text;
}

// ─── AI Handlers ──────────────────────────────────────────────

async function handleMatch(
  student: StudentContext,
  internship: InternshipContext
): Promise<MatchResult> {
  const openai = getOpenAIClient();
  const res = await openai.chat.completions.create({
    model: AI_MODEL_REASONING,
    temperature: 0.3,
    max_tokens: 1024,
    messages: [
      {
        role: 'system',
        content: `Du är en AI-matchningsexpert för svenska praktikplatser. Analysera hur väl en student matchar en praktikplats.

Returnera ENBART giltig JSON (ingen extra text) med exakt denna struktur:
{
  "score": <0-100>,
  "summary": "<1-2 meningar om matchningen>",
  "strengths": ["<styrka 1>", "<styrka 2>", ...],
  "gaps": ["<lucka 1>", "<lucka 2>", ...],
  "tip": "<ett konkret tips för studenten>"
}

Vikter: kompetenser 40%, utbildning 20%, stad/plats 15%, branschintressen 15%, praktiktyp 10%.
Svara alltid på svenska.`
      },
      {
        role: 'user',
        content: `STUDENT:\n${studentSummary(student)}\n\nPRAKTIKPLATS:\n${internshipSummary(internship)}`
      }
    ]
  });

  const content = res.choices[0]?.message?.content ?? '{}';
  return JSON.parse(extractJSON(content)) as MatchResult;
}

async function handleCoverLetter(
  student: StudentContext,
  internship: InternshipContext,
  tone: string,
  extras?: string
): Promise<CoverLetterResult> {
  const openai = getOpenAIClient();
  const toneMap: Record<string, string> = {
    formal: 'formell och professionell',
    casual: 'avslappnad och personlig',
    energetic: 'energisk och entusiastisk'
  };
  const toneDesc = toneMap[tone] || toneMap.formal;

  const res = await openai.chat.completions.create({
    model: AI_MODEL_CREATIVE,
    temperature: 0.7,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: `Du är en expert på att skriva personliga brev för svenska praktikansökningar.
Skriv ett personligt brev med en ${toneDesc} ton.
Brevet ska vara 200–350 ord, strukturerat med:
1. Inledning — varför du söker just denna praktikplats
2. Din bakgrund — utbildning och relevanta kompetenser
3. Vad du kan bidra med — kopplat till krav/beskrivning
4. Avslutning — tillgänglighet och entusiasm

Skriv BARA brevet, ingen extra text runt det. Använd naturlig svenska.`
      },
      {
        role: 'user',
        content: `STUDENT:\n${studentSummary(student)}\n\nPRAKTIKPLATS:\n${internshipSummary(internship)}${extras ? `\n\nEXTRA FRÅN STUDENTEN:\n${extras}` : ''}`
      }
    ]
  });

  return { letter: res.choices[0]?.message?.content ?? '' };
}

async function handleProfileTips(student: StudentContext): Promise<ProfileTipsResult> {
  const openai = getOpenAIClient();
  const res = await openai.chat.completions.create({
    model: AI_MODEL_REASONING,
    temperature: 0.4,
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: `Du är en karriärrådgivare som hjälper svenska studenter förbättra sina profiler för praktikansökningar.

Analysera studentens profil och ge konkreta förbättringsförslag.

Returnera ENBART giltig JSON (ingen extra text) med exakt denna struktur:
{
  "overallScore": <0-100>,
  "summary": "<1-2 meningar sammanfattning>",
  "tips": [
    {
      "area": "<t.ex. Kompetenser, Bio, Utbildning>",
      "current": "<vad som finns nu>",
      "suggestion": "<konkret förbättringsförslag>",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Ge 3–6 tips. Fokusera på det som har störst påverkan på matchning.
Svara alltid på svenska.`
      },
      {
        role: 'user',
        content: `STUDENTPROFIL:\n${studentSummary(student)}`
      }
    ]
  });

  const content = res.choices[0]?.message?.content ?? '{}';
  return JSON.parse(extractJSON(content)) as ProfileTipsResult;
}

async function handleInterviewPrep(
  student: StudentContext,
  internship: InternshipContext
): Promise<InterviewPrepResult> {
  const openai = getOpenAIClient();
  const res = await openai.chat.completions.create({
    model: AI_MODEL_REASONING,
    temperature: 0.5,
    max_tokens: 2500,
    messages: [
      {
        role: 'system',
        content: `Du är en intervjucoach som förbereder svenska studenter för praktikintervjuer.

Generera skräddarsydda intervjufrågor baserade på studentens profil och praktikplatsens krav.

Returnera ENBART giltig JSON (ingen extra text) med exakt denna struktur:
{
  "questions": [
    {
      "question": "<intervjufrågan>",
      "category": "<t.ex. Teknisk, Beteende, Motivation, Situation>",
      "tip": "<kort tips för att svara bra>",
      "exampleAnswer": "<exempel på ett bra svar anpassat till studenten>"
    }
  ],
  "generalTips": ["<allmänt tips 1>", "<allmänt tips 2>", ...]
}

Ge 6–8 frågor och 3–4 allmänna tips. Blanda tekniska och beteendefrågor.
Anpassa exempelsvar efter studentens faktiska kompetenser och bakgrund.
Svara alltid på svenska.`
      },
      {
        role: 'user',
        content: `STUDENT:\n${studentSummary(student)}\n\nPRAKTIKPLATS:\n${internshipSummary(internship)}`
      }
    ]
  });

  const content = res.choices[0]?.message?.content ?? '{}';
  return JSON.parse(extractJSON(content)) as InterviewPrepResult;
}

async function handleSkillGap(
  student: StudentContext,
  internship: InternshipContext
): Promise<SkillGapResult> {
  const openai = getOpenAIClient();
  const res = await openai.chat.completions.create({
    model: AI_MODEL_REASONING,
    temperature: 0.3,
    max_tokens: 2500,
    messages: [
      {
        role: 'system',
        content: `Du är en AI-karriärrådgivare som analyserar kompetensgap mellan en students profil och en praktikplats krav.

Jämför studentens kompetenser med praktikplatsens krav och identifiera:
1. Vilka kompetenser studenten redan har som matchar
2. Vilka kompetenser som saknas eller behöver förbättras
3. Konkreta lärande-rekommendationer med uppskattad tidsåtgång

För varje kompetensgap, ge en konkret rekommendation med en gratis lärresurs (t.ex. YouTube-kurs, dokumentation, tutorial).

Returnera ENBART giltig JSON (ingen extra text) med exakt denna struktur:
{
  "readinessScore": <0-100>,
  "summary": "<1-2 meningar om studentens beredskap>",
  "matchedSkills": ["<kompetens som matchar 1>", "<kompetens som matchar 2>", ...],
  "gaps": [
    {
      "skill": "<kompetens som saknas/behöver förbättras>",
      "studentLevel": "saknas" | "nybörjare" | "grundläggande" | "god",
      "requiredLevel": "grundläggande" | "god" | "avancerad",
      "priority": "high" | "medium" | "low",
      "recommendation": "<konkret rekommendation, t.ex. 'Lär dig grunderna i TypeScript genom en 2-timmars kurs'>",
      "resourceUrl": "<URL till gratis resurs, t.ex. YouTube-video, docs, tutorial>",
      "estimatedTime": "<t.ex. '2 timmar', '1 dag', '1 vecka'>"
    }
  ],
  "actionPlan": "<kort handlingsplan, 2-3 meningar om vad studenten bör prioritera>"
}

Ge 3–8 gaps beroende på hur mycket som saknas. Sortera efter priority (high först).
Om studenten redan har alla kompetenser, ge en tom gaps-array och hög readinessScore.
Var realistisk med tidsuppskattningar. Föredra gratis resurser på svenska om möjligt, annars engelska.
Svara alltid på svenska.`
      },
      {
        role: 'user',
        content: `STUDENT:\n${studentSummary(student)}\n\nPRAKTIKPLATS:\n${internshipSummary(internship)}`
      }
    ]
  });

  const content = res.choices[0]?.message?.content ?? '{}';
  return JSON.parse(extractJSON(content)) as SkillGapResult;
}

// ─── Route Handler ────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Verify authentication
  const sessionCookie = request.cookies.get('appwrite_session');
  if (!sessionCookie) {
    return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
  }

  try {
    const decoded = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString('utf-8'));
    if (!decoded.id) {
      return NextResponse.json({ error: 'Ej autentiserad.' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Ogiltig session.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as AIRequest;

    switch (body.action) {
      case 'match': {
        const result = await handleMatch(body.payload.student, body.payload.internship);
        return NextResponse.json({ action: 'match', result });
      }
      case 'cover-letter': {
        const result = await handleCoverLetter(
          body.payload.student,
          body.payload.internship,
          body.payload.tone,
          body.payload.extras
        );
        return NextResponse.json({ action: 'cover-letter', result });
      }
      case 'profile-tips': {
        const result = await handleProfileTips(body.payload.student);
        return NextResponse.json({ action: 'profile-tips', result });
      }
      case 'interview-prep': {
        const result = await handleInterviewPrep(body.payload.student, body.payload.internship);
        return NextResponse.json({ action: 'interview-prep', result });
      }
      case 'skill-gap': {
        const result = await handleSkillGap(body.payload.student, body.payload.internship);
        return NextResponse.json({ action: 'skill-gap', result });
      }
      default:
        return NextResponse.json({ error: 'Okänd AI-åtgärd.' }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI-tjänsten misslyckades.';
    console.error('[POST /api/ai] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
