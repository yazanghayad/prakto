#!/usr/bin/env node

/**
 * Seed blog posts for the Resources section.
 *
 * Usage:
 *   node scripts/seed-blog.mjs
 *
 * Requires .env.local with APPWRITE_API_KEY set.
 */

import { Client, Databases, ID, Query } from 'node-appwrite';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'prakto';
const COLLECTION_ID = 'blog_posts';

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('❌  Missing APPWRITE env vars in .env.local');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// ─── Blog posts ────────────────────────────────────────────────

const BLOG_POSTS = [
  {
    title: '5 tips för att skriva ett CV som sticker ut',
    slug: '5-tips-cv-som-sticker-ut',
    excerpt:
      'Ditt CV är ditt första intryck. Här är fem konkreta tips som hjälper dig att fånga arbetsgivarens uppmärksamhet direkt.',
    content: `Att skriva ett bra CV handlar inte om att lista allt du har gjort — det handlar om att visa vad du kan bidra med.

1. Anpassa varje CV
Skicka aldrig samma CV till alla. Läs annonsen noggrant och lyft fram de erfarenheter och kompetenser som matchar. Använd samma nyckelord som arbetsgivaren använder.

2. Börja med det viktigaste
Rekryterare lägger i snitt 7 sekunder på att skumma ett CV. Ha en kort, slagkraftig profil/sammanfattning längst upp som sammanfattar vem du är och vad du söker.

3. Visa resultat, inte bara uppgifter
Istället för "Ansvarade för sociala medier" — skriv "Ökade Instagram-följare med 40% på 3 månader genom riktad innehållsstrategi." Siffror och resultat väger tyngre.

4. Håll det kort och snyggt
1-2 sidor räcker. Använd tydliga rubriker, punktlistor och konsekvent formatering. Undvik bilder, färger och onödig grafik om du inte söker en kreativ tjänst.

5. Kolla stavning och grammatik
Slarvfel ger ett oprofessionellt intryck. Låt någon annan läsa igenom ditt CV innan du skickar.`,
    category: 'cv',
    status: 'published',
    coverImageUrl: ''
  },
  {
    title: 'Så förbereder du dig för en intervju',
    slug: 'forbered-dig-for-intervju',
    excerpt:
      'Nervös inför en intervju? Det är helt normalt. Här är en guide med praktiska steg som hjälper dig att känna dig trygg och förberedd.',
    content: `En bra intervju börjar långt innan du kliver in genom dörren. Här är vad du kan göra för att vara så förberedd som möjligt.

Researcha företaget
Gå igenom hemsidan, sociala medier och senaste nyheterna. Vad gör företaget? Vilka värderingar lyfter de? Visa att du har gjort din hemläxa.

Förbered svar på vanliga frågor
Tänk igenom svar på klassiker som:
- "Berätta om dig själv"
- "Varför vill du jobba hos oss?"
- "Vad är dina styrkor och svagheter?"
- "Berätta om en utmaning du löst"

Använd STAR-metoden (Situation, Task, Action, Result) för att strukturera dina svar.

Förbered egna frågor
Att ställa frågor visar engagemang. Exempel:
- "Hur ser en typisk dag ut på den här rollen?"
- "Hur fungerar er onboarding?"
- "Vilka utvecklingsmöjligheter finns?"

Klädsel och kroppsspråk
Klä dig ett snäpp finare än den dagliga dresscoden. Hälsa med ett fast handslag, håll ögonkontakt och le. Nervositet är okay — det visar att du bryr dig.

Efter intervjun
Skicka ett kort tackmeddelande samma dag. Det visar professionalism och gör att du stannar i minnet.`,
    category: 'intervju',
    status: 'published',
    coverImageUrl: ''
  },
  {
    title: 'Personligt brev: Så skriver du ett som faktiskt läses',
    slug: 'personligt-brev-guide',
    excerpt:
      'Många hoppar över det personliga brevet — men det kan vara det som skiljer dig från andra sökande. Lär dig skriva ett som gör intryck.',
    content: `Det personliga brevet är din chans att visa vem du är bakom meritlistan. Gör det personligt, konkret och kort.

Inledningen avgör
Skippa "Jag skriver för att söka tjänsten som...". Börja istället med något som fångar:
- En relevant erfarenhet
- Varför just detta företag intresserar dig
- En koppling mellan din bakgrund och tjänsten

Strukturen
Ett bra personligt brev har tre delar:

1. INLEDNING — Varför du söker och vad som lockade dig
2. MITTEN — Vad du kan bidra med (koppla till annonsen)
3. AVSLUTNING — Sammanfatta och visa entusiasm

Gör det personligt
Standardbrev märks direkt. Nämn företagets namn, referera till något specifikt de gör, och förklara varför just du passar.

Håll det kort
Max en A4-sida. Rekryterare har inte tid att läsa romaner. Varje mening ska ha ett syfte.

Vanliga misstag att undvika
- Kopiera CV:t — brevet ska komplettera, inte upprepa
- Vara för generell — "Jag är driven och social" säger ingenting
- Glömma att anpassa — ett brev per ansökan, alltid`,
    category: 'brev',
    status: 'published',
    coverImageUrl: ''
  },
  {
    title: 'Från praktik till fast jobb — 4 framgångshistorier',
    slug: 'fran-praktik-till-fast-jobb',
    excerpt:
      'Praktiken är ofta starten på en karriär. Läs hur fyra studenter använde sin praktiktid för att landa sitt drömjobb.',
    content: `Praktik är inte bara utbildning — det är en chans att visa vad du kan. Här är fyra studenter som omvandlade sin praktik till en fast anställning.

Emma, 24 — Webbutvecklare
Emma gjorde sin LIA på en startup i Göteborg. Hon tog initiativ att bygga en intern dashboard som sparade teamet timmar varje vecka. "Jag visade att jag kunde lösa riktiga problem, inte bara följa instruktioner." Efter praktiken erbjöds hon en fast tjänst.

Ali, 23 — Marknadsassistent
Ali var praktikant på en byrå i Stockholm. Han kom med en idé för en TikTok-kampanj som genererade 500K visningar. "Min handledare sa att de aldrig hade testat det formatet — mitt förslag öppnade en ny kanal för dem."

Sofia, 25 — UX-designer
Sofia gjorde sin praktik på distans under pandemin. Trots utmaningarna byggde hon starka relationer genom att alltid vara tillgänglig och proaktiv. "Jag bokade korta check-ins med mitt team varje dag. Det gjorde stor skillnad."

Marcus, 22 — Systemutvecklare
Marcus fick sin praktikplats genom Prakto. Han bidrog till en migration av deras betalningssystem. "Jag lärde mig mer på 20 veckor praktik än på hela utbildningen."

Gemensamt för alla: De väntade inte på att bli tilldelade uppgifter — de tog initiativ.`,
    category: 'inspiration',
    status: 'published',
    coverImageUrl: ''
  },
  {
    title: 'Så navigerar du din första vecka på praktiken',
    slug: 'forsta-veckan-pa-praktiken',
    excerpt:
      'Första veckan på en ny arbetsplats kan kännas överväldigande. Här är en guide för att komma igång på rätt sätt.',
    content: `Du har fått praktikplatsen — grattis! Nu börjar det på riktigt. Här är tips för att göra din första vecka så bra som möjligt.

Dag 1: Lyssna och observera
Ta in atmosfären. Lär dig namnen på dina kollegor. Ställ frågor om kultur, rutiner och verktyg. Det är helt okej att inte kunna allt från dag ett.

Dag 2-3: Förstå din roll
Prata med din handledare om förväntningar. Vad ska du leverera? Vilka verktyg använder ni? Finns det en onboarding-plan?

Dag 4-5: Börja bidra
Även små bidrag räknas. Erbjud dig att hjälpa till med en uppgift, ta anteckningar på möten, eller förbättra dokumentation. Visa att du vill lära och bidra.

Genom veckan:
- Skriv dagbok — notera vad du lär dig, frågor du har, kontakter du gör
- Var punktlig — det visar respekt
- Fråga om feedback — vänta inte till slutet av praktiken
- Nätverka — lunchsamtal och fikapauser bygger relationer

Vanliga misstag
- Låtsas förstå när du inte gör det — det är bättre att fråga
- Sitta tyst på möten — visa att du är engagerad
- Jämföra dig med anställda — du är där för att lära`,
    category: 'tips',
    status: 'published',
    coverImageUrl: ''
  },
  {
    title: 'Bygg ditt professionella nätverk redan under studietiden',
    slug: 'bygg-ditt-natverk',
    excerpt:
      'Nätverkande behöver inte vara konstigt. Här är enkla sätt att bygga kontakter som kan öppna dörrar till framtida jobb.',
    content: `Många jobb tillsätts genom kontakter — inte genom annonser. Ju tidigare du börjar bygga ditt nätverk, desto bättre.

LinkedIn — din digitala yrkesprofil
Skapa en professionell LinkedIn-profil. Lägg till en bra bild, en tydlig rubrik och en sammanfattning. Börja connecta med:
- Klasskompisar och lärare
- Föreläsare och gästtalare
- Praktikhandledare och kollegor

Gå på branschevent
Meetups, hackathons, och career fairs är utmärkta tillfällen att träffa folk i branschen. Förbered en kort presentation av dig själv (30 sekunder).

Kontakta folk du beundrar
Skicka ett artigt meddelande på LinkedIn: "Hej! Jag studerar [program] och är nyfiken på din karriär. Skulle du ha tid för ett kort samtal?" De flesta uppskattar genuint intresse.

Ge innan du tar
Nätverkande handlar inte om att be om tjänster. Dela intressanta artiklar, gratulera till framgångar, kommentera andras inlägg. Bygg relationer genom att vara genuint engagerad.

Praktiken = nätverkande i praktiken
Din praktikplats är ett inbyggt nätverk. Lär känna folk utanför ditt team. Be om att skugga andra avdelningar. Delta i after works om möjligheten ges.

Tänk långsiktigt
Ditt nätverk idag kan vara din karriärresurs om fem år. Håll kontakten, gratulera till nya jobb, och var den person andra vill rekommendera.`,
    category: 'karriar',
    status: 'published',
    coverImageUrl: ''
  }
];

// ─── Seed function ─────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding blog posts...\n');

  // Check if collection exists and has posts already
  try {
    const existing = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.limit(1)
    ]);
    if (existing.total > 0) {
      console.log(`ℹ️  Collection already has ${existing.total} posts. Skipping seed.`);
      console.log('   To re-seed, delete existing posts first.');
      return;
    }
  } catch (err) {
    console.error('❌  Collection "blog_posts" not found. Create it in Appwrite first.');
    console.error('   Required attributes:');
    console.error('   - title (string, 200)');
    console.error('   - slug (string, 200)');
    console.error('   - excerpt (string, 500)');
    console.error('   - content (string, 10000)');
    console.error('   - category (string, 50)');
    console.error('   - coverImageUrl (string, 500)');
    console.error('   - authorId (string, 50)');
    console.error('   - status (string, 20)');
    console.error('   - publishedAt (string, 30)');
    console.error('   - createdAt (string, 30)');
    console.error('   - updatedAt (string, 30)');
    process.exit(1);
  }

  const now = new Date().toISOString();

  for (const post of BLOG_POSTS) {
    try {
      // Offset publishedAt so posts have different dates
      const idx = BLOG_POSTS.indexOf(post);
      const pubDate = new Date();
      pubDate.setDate(pubDate.getDate() - idx * 3); // 3 days apart

      await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        coverImageUrl: post.coverImageUrl,
        authorId: 'system',
        status: post.status,
        publishedAt: pubDate.toISOString(),
        createdAt: now,
        updatedAt: now
      });
      console.log(`  ✅  ${post.title}`);
    } catch (err) {
      console.error(`  ❌  Failed: ${post.title}`, err.message || err);
    }
  }

  console.log('\n✨ Done! Blog posts seeded.');
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
